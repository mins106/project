// routes/posts.js
const express = require('express');
const router = express.Router();
const db = require('../db/database'); // database.js 경로에 맞게 조정
const updateBestPosts = require('../utils/updateBestPosts');

// --- 유틸: 로그인 사용자 식별 (데모용: x-user-id 헤더 사용) ---
function getUserId(req) {
  const uid = req.header('x-user-id');
  if (!uid) return null;
  const n = Number(uid);
  return Number.isFinite(n) ? n : null;
}

function getAuthorMeta(req) {
  const name = (req.header('x-author-name') || req.body?.authorName || '').trim();
  const sid  = (req.header('x-student-id')  || req.body?.studentId  || '').trim();
  return { name, studentId: sid };
}

async function ownerOnly(req, res, next) {
  try {
    const postId = Number(req.params.id);
    const row = await db.get('SELECT author, studentId FROM posts WHERE id = ?', [postId]);
    if (!row) return res.status(404).json({ error: '게시글이 존재하지 않습니다.' });

    const { name, studentId } = getAuthorMeta(req);
    if (!name || !studentId) return res.status(401).json({ error: '인증 정보가 없습니다.' });

    if (row.author !== name || row.studentId !== studentId) {
      return res.status(403).json({ error: '작성자만 가능합니다.' });
    }
    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '서버 오류' });
  }
}

// GET /api/posts?q=키워드  (목록)
// 로그인되어 있으면 각 게시글에 myReaction 포함
router.get('/', async (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  const userId = getUserId(req);
  try {
    let sql = `
      SELECT 
        p.id, p.title, p.content, p.author, p.studentId, p.createdAt, p.tag, 
        p.likes, p.dislikes, p.comments, p.isBest
        ${userId ? ', r.reaction AS myReaction' : ''}
      FROM posts p
      ${userId ? 'LEFT JOIN post_reactions r ON r.post_id = p.id AND r.user_id = ?' : ''}
    `;
    const params = [];
    if (userId) params.push(userId);
    if (q) {
      sql += ` WHERE LOWER(p.title) LIKE ? OR LOWER(p.content) LIKE ? `;
      params.push(`%${q}%`, `%${q}%`);
    }
    sql += ` ORDER BY p.isBest DESC, datetime(p.createdAt) DESC `;
    const posts = await db.all(sql, params);
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '게시글 목록 불러오기 실패' });
  }
});

// 📌 BEST 3개만 가져오기 (집계 컬럼 사용)
router.get('/best', async (req, res) => {
  try {
    const rows = await db.all(`
      SELECT id, title, content, author, studentId, tag, likes, dislikes, comments, createdAt
      FROM posts
      WHERE isBest = 1
      ORDER BY (COALESCE(likes,0) - COALESCE(dislikes,0)) DESC,
               COALESCE(likes,0) DESC,
               datetime(createdAt) DESC
      LIMIT 3
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'BEST 게시글 불러오기 실패' });
  }
});

// 게시글 상세 조회 (댓글은 별도 엔드포인트 사용 권장)
router.get('/:id', async (req, res) => {
  const postId = Number(req.params.id);
  const userId = getUserId(req);

  try {
    const post = await db.get('SELECT * FROM posts WHERE id = ?', [postId]);
    if (!post) return res.status(404).json({ error: '게시글이 존재하지 않습니다.' });

    let myReaction = null;
    if (userId) {
      const r = await db.get(
        'SELECT reaction FROM post_reactions WHERE user_id = ? AND post_id = ?',
        [userId, postId]
      );
      myReaction = r?.reaction || null; // 'like' | 'dislike' | null
    }

    res.json({ ...post, myReaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '게시글 불러오기 실패' });
  }
});

/**
 * 단일 반응 엔드포인트
 * POST /api/posts/:id/reaction
 * body: { reaction: 'like' | 'dislike' | 'none' }
 */
router.post('/:id/reaction', async (req, res) => {
  const postId = Number(req.params.id);
  const userId = getUserId(req);
  const { reaction } = req.body || {};

  if (!userId) return res.status(401).json({ error: '로그인이 필요합니다.' });
  if (!['like', 'dislike', 'none'].includes(reaction)) {
    return res.status(400).json({ error: 'reaction 값이 올바르지 않습니다.' });
  }

  try {
    await db.exec('BEGIN');

    const cur = await db.get(
      'SELECT reaction FROM post_reactions WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    if (reaction === 'none') {
      if (cur) {
        await db.run('DELETE FROM post_reactions WHERE user_id = ? AND post_id = ?', [userId, postId]);
        if (cur.reaction === 'like') {
          await db.run('UPDATE posts SET likes = MAX(likes - 1, 0) WHERE id = ?', [postId]);
        } else if (cur.reaction === 'dislike') {
          await db.run('UPDATE posts SET dislikes = MAX(dislikes - 1, 0) WHERE id = ?', [postId]);
        }
      }
    } else if (reaction === 'like') {
      if (!cur) {
        await db.run('INSERT INTO post_reactions (user_id, post_id, reaction) VALUES (?, ?, ?)', [userId, postId, 'like']);
        await db.run('UPDATE posts SET likes = likes + 1 WHERE id = ?', [postId]);
      } else if (cur.reaction === 'dislike') {
        await db.run('UPDATE post_reactions SET reaction = ? WHERE user_id = ? AND post_id = ?', ['like', userId, postId]);
        await db.run('UPDATE posts SET dislikes = MAX(dislikes - 1, 0), likes = likes + 1 WHERE id = ?', [postId]);
      }
    } else if (reaction === 'dislike') {
      if (!cur) {
        await db.run('INSERT INTO post_reactions (user_id, post_id, reaction) VALUES (?, ?, ?)', [userId, postId, 'dislike']);
        await db.run('UPDATE posts SET dislikes = dislikes + 1 WHERE id = ?', [postId]);
      } else if (cur.reaction === 'like') {
        await db.run('UPDATE post_reactions SET reaction = ? WHERE user_id = ? AND post_id = ?', ['dislike', userId, postId]);
        await db.run('UPDATE posts SET likes = MAX(likes - 1, 0), dislikes = dislikes + 1 WHERE id = ?', [postId]);
      }
    }

    await db.exec('COMMIT');

    const updated = await db.get('SELECT likes, dislikes FROM posts WHERE id = ?', [postId]);
    const mine = await db.get(
      'SELECT reaction FROM post_reactions WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    try { await updateBestPosts(); } catch (_) {}

    res.json({
      likes: updated?.likes ?? 0,
      dislikes: updated?.dislikes ?? 0,
      myReaction: mine?.reaction || null,
    });

  } catch (err) {
    try { await db.exec('ROLLBACK'); } catch (_) {}
    console.error(err);
    res.status(500).json({ error: '반응 처리 실패' });
  }
});

/* ============================================================
 * 댓글 API (대댓글 지원)
 * ============================================================ */

/** (A) 댓글 트리 조회
 * GET /api/posts/:id/comments
 * 반환: depth 포함 평탄 리스트(부모 다음에 자식이 오도록 path 정렬)
 */
router.get('/:id/comments', async (req, res) => {
  const postId = Number(req.params.id);
  try {
    const sql = `
      WITH RECURSIVE thread AS (
        SELECT
          id, postId, parentId, author, studentId, text,
          createdAt, updatedAt,
          0 AS depth,
          printf('%09d', id) AS path
        FROM comments
        WHERE postId = ? AND parentId IS NULL

        UNION ALL

        SELECT
          c.id, c.postId, c.parentId, c.author, c.studentId, c.text,
          c.createdAt, c.updatedAt,
          t.depth + 1 AS depth,
          t.path || '-' || printf('%09d', c.id) AS path
        FROM comments c
        JOIN thread t ON c.parentId = t.id
      )
      SELECT * FROM thread
      ORDER BY path;
    `;
    const rows = await db.all(sql, [postId]);
    res.json({ comments: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '댓글 목록 불러오기 실패' });
  }
});

/** (B) 댓글 작성 (원댓글/대댓글 공용)
 * POST /api/posts/:id/comments
 * body: { text, author?, studentId?, parentId? }
 */
router.post('/:id/comments', async (req, res) => {
  const postId = Number(req.params.id);
  const { text, author = '익명', studentId = '', parentId = null } = req.body || {};

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: '댓글이 비어 있습니다.' });
  }

  try {
    await db.exec('BEGIN');

    await db.run(
      `INSERT INTO comments (postId, parentId, text, author, studentId, createdAt)
       VALUES (?, ?, ?, ?, ?, datetime('now','localtime'))`,
      [postId, parentId, text.trim(), author, studentId]
    );

    // 집계 컬럼 posts.comments 는 "총 댓글 수" 기준으로 재계산 (CASCADE 삭제 등에 안전)
    await db.run(
      `UPDATE posts
         SET comments = (SELECT COUNT(*) FROM comments WHERE postId = ?)
       WHERE id = ?`,
      [postId, postId]
    );

    await db.exec('COMMIT');
    res.status(201).json({ success: true });
  } catch (err) {
    try { await db.exec('ROLLBACK'); } catch (_) {}
    console.error(err);
    res.status(500).json({ error: '댓글 작성 실패' });
  }
});

/** (C) 댓글 수정
 * PUT /api/posts/:postId/comments/:commentId
 * body: { text }
 */
router.put('/:postId/comments/:commentId', async (req, res) => {
  const postId = Number(req.params.postId);
  const commentId = Number(req.params.commentId);
  const { text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: '내용이 비었습니다.' });

  try {
    const changed = await db.run(
      `UPDATE comments
         SET text = ?, updatedAt = datetime('now','localtime')
       WHERE id = ? AND postId = ?`,
      [text.trim(), commentId, postId]
    );
    res.json({ success: true, changed: changed ? 1 : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '댓글 수정 실패' });
  }
});

/** (D) 댓글 삭제(부모/자식 포함)
 * DELETE /api/posts/:postId/comments/:commentId
 * - parentId에 ON DELETE CASCADE가 걸려 있으면 자식은 FK로 자동 삭제
 * - posts.comments 집계는 재계산
 */
router.delete('/:postId/comments/:commentId', async (req, res) => {
  const postId = Number(req.params.postId);
  const commentId = Number(req.params.commentId);

  try {
    await db.exec('BEGIN');

    await db.run(`DELETE FROM comments WHERE id = ? AND postId = ?`, [commentId, postId]);

    await db.run(
      `UPDATE posts
         SET comments = (SELECT COUNT(*) FROM comments WHERE postId = ?)
       WHERE id = ?`,
      [postId, postId]
    );

    await db.exec('COMMIT');
    res.json({ success: true });
  } catch (err) {
    try { await db.exec('ROLLBACK'); } catch (_) {}
    console.error(err);
    res.status(500).json({ error: '댓글 삭제 실패' });
  }
});

// 게시글 작성
router.post('/', async (req, res) => {
  const { title, content, tag, author, studentId } = req.body;

  if (!title || !content || !tag || !author || !studentId) {
    return res.status(400).json({ error: '입력값 누락' });
  }

  try {
    const createdAt = new Date().toISOString();
    await db.run(
      `INSERT INTO posts (title, content, tag, author, studentId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, content, tag, author, studentId, createdAt]
    );
    try { await updateBestPosts(); } catch (_) {}
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('❌ 게시글 작성 오류:', err.message);
    res.status(500).json({ error: '게시글 작성 실패' });
  }
});

// 삭제
router.delete('/:id', ownerOnly, async (req, res) => {
  const postId = Number(req.params.id);
  try {
    await db.exec('BEGIN');
    await db.run('DELETE FROM comments WHERE postId = ?', [postId]); // 트리거가 있으면 생략 가능
    await db.run('DELETE FROM post_reactions WHERE post_id = ?', [postId]);
    await db.run('DELETE FROM posts WHERE id = ?', [postId]);
    await db.exec('COMMIT');
    try { await updateBestPosts(); } catch (_) {}
    res.json({ ok: true });
  } catch (err) {
    try { await db.exec('ROLLBACK'); } catch (_) {}
    console.error('삭제 실패:', err);
    res.status(500).json({ error: '게시글 삭제 실패' });
  }
});

module.exports = router;