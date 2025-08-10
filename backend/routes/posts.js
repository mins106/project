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

// 게시글 상세 조회 (댓글 + 현재 사용자 반응)
router.get('/:id', async (req, res) => {
  const postId = Number(req.params.id);
  const userId = getUserId(req);

  try {
    const post = await db.get('SELECT * FROM posts WHERE id = ?', [postId]);
    if (!post) return res.status(404).json({ error: '게시글이 존재하지 않습니다.' });

    const comments = await db.all(
      'SELECT * FROM comments WHERE postId = ? ORDER BY createdAt ASC',
      [postId]
    );

    let myReaction = null;
    if (userId) {
      const r = await db.get(
        'SELECT reaction FROM post_reactions WHERE user_id = ? AND post_id = ?',
        [userId, postId]
      );
      myReaction = r?.reaction || null; // 'like' | 'dislike' | null
    }

    res.json({ ...post, comments, myReaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '게시글 불러오기 실패' });
  }
});

/**
 * 단일 반응 엔드포인트
 * POST /api/posts/:id/reaction
 * body: { reaction: 'like' | 'dislike' | 'none' }
 * - 'like'    : 좋아요로 설정(기존 싫어요면 해제하고 좋아요로 변경)
 * - 'dislike' : 싫어요로 설정(기존 좋아요면 해제하고 싫어요로 변경)
 * - 'none'    : 현재 반응 취소
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

    // 경우의 수 정리
    if (reaction === 'none') {
      if (cur) {
        // 기존 반응을 지우고 posts 집계 감소
        await db.run(
          'DELETE FROM post_reactions WHERE user_id = ? AND post_id = ?',
          [userId, postId]
        );
        if (cur.reaction === 'like') {
          await db.run('UPDATE posts SET likes = MAX(likes - 1, 0) WHERE id = ?', [postId]);
        } else if (cur.reaction === 'dislike') {
          await db.run('UPDATE posts SET dislikes = MAX(dislikes - 1, 0) WHERE id = ?', [postId]);
        }
      }
    } else if (reaction === 'like') {
      if (!cur) {
        // 새로 좋아요
        await db.run(
          'INSERT INTO post_reactions (user_id, post_id, reaction) VALUES (?, ?, ?)',
          [userId, postId, 'like']
        );
        await db.run('UPDATE posts SET likes = likes + 1 WHERE id = ?', [postId]);
      } else if (cur.reaction === 'dislike') {
        // 싫어요 -> 좋아요로 전환
        await db.run(
          'UPDATE post_reactions SET reaction = ? WHERE user_id = ? AND post_id = ?',
          ['like', userId, postId]
        );
        await db.run('UPDATE posts SET dislikes = MAX(dislikes - 1, 0), likes = likes + 1 WHERE id = ?', [postId]);
      }
      // cur.reaction === 'like'면 변화 없음
    } else if (reaction === 'dislike') {
      if (!cur) {
        // 새로 싫어요
        await db.run(
          'INSERT INTO post_reactions (user_id, post_id, reaction) VALUES (?, ?, ?)',
          [userId, postId, 'dislike']
        );
        await db.run('UPDATE posts SET dislikes = dislikes + 1 WHERE id = ?', [postId]);
      } else if (cur.reaction === 'like') {
        // 좋아요 -> 싫어요로 전환
        await db.run(
          'UPDATE post_reactions SET reaction = ? WHERE user_id = ? AND post_id = ?',
          ['dislike', userId, postId]
        );
        await db.run('UPDATE posts SET likes = MAX(likes - 1, 0), dislikes = dislikes + 1 WHERE id = ?', [postId]);
      }
      // cur.reaction === 'dislike'면 변화 없음
    }

    await db.exec('COMMIT');

    // 최신 상태 반환
    const updated = await db.get('SELECT likes, dislikes FROM posts WHERE id = ?', [postId]);
    const mine = await db.get(
      'SELECT reaction FROM post_reactions WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    // BEST 갱신
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

// 댓글 작성
router.post('/:id/comments', async (req, res) => {
  const postId = req.params.id;
  const { text, author = '익명', studentId = '' } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: '댓글이 비어 있습니다.' });
  }

  try {
    await db.run(
      'INSERT INTO comments (postId, text, author, studentId) VALUES (?, ?, ?, ?)',
      [postId, text.trim(), author, studentId]
    );
    await db.run('UPDATE posts SET comments = comments + 1 WHERE id = ?', [postId]);

    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '댓글 작성 실패' });
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
    await db.run('DELETE FROM comments WHERE postId = ?', [postId]);
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