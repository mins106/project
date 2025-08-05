const express = require('express');
const router = express.Router();
const db = require('../db/database'); // database.js 경로에 맞게 조정

// 게시글 전체 목록 조회 (최신순)
router.get('/', async (req, res) => {
  try {
    const posts = await db.all(
      `SELECT id, title, author, studentId, createdAt, tag, likes, dislikes, comments
      FROM posts
      ORDER BY createdAt DESC`
    );
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: '게시글 목록 불러오기 실패' });
  }
});

// 게시글 상세 조회 (댓글 포함)
router.get('/:id', async (req, res) => {
  const postId = req.params.id;

  try {
    const post = await db.get('SELECT * FROM posts WHERE id = ?', [postId]);
    if (!post) return res.status(404).json({ error: '게시글이 존재하지 않습니다.' });

    const comments = await db.all('SELECT * FROM comments WHERE postId = ? ORDER BY createdAt ASC', [postId]);

    res.json({ ...post, comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '게시글 불러오기 실패' });
  }
});

// 좋아요 증가
router.post('/:id/like', async (req, res) => {
  const postId = req.params.id;
  try {
    await db.run('UPDATE posts SET likes = likes + 1 WHERE id = ?', [postId]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: '좋아요 실패' });
  }
});

// 좋아요 취소
router.post('/:id/unlike', async (req, res) => {
  const postId = req.params.id;
  try {
    await db.run('UPDATE posts SET likes = MAX(likes - 1, 0) WHERE id = ?', [postId]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: '좋아요 취소 실패' });
  }
});

// 싫어요 증가
router.post('/:id/dislike', async (req, res) => {
  const postId = req.params.id;
  try {
    await db.run('UPDATE posts SET dislikes = dislikes + 1 WHERE id = ?', [postId]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: '싫어요 실패' });
  }
});

// 싫어요 취소
router.post('/:id/undislike', async (req, res) => {
  const postId = req.params.id;
  try {
    await db.run('UPDATE posts SET dislikes = MAX(dislikes - 1, 0) WHERE id = ?', [postId]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: '싫어요 취소 실패' });
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
    res.status(500).json({ error: '댓글 작성 실패' });
  }
});

// 게시글 작성
router.post('/', async (req, res) => {
  const { title, content, tag, author, studentId } = req.body;

  console.log('받은 데이터:', { title, content, tag, author, studentId });

  if (!title || !content || !tag || !author || !studentId) {
    console.log('❌ 입력값 누락!');
    return res.status(400).json({ error: '입력값 누락' });
  }

  try {
    const createdAt = new Date().toISOString();

    await db.run(
      `INSERT INTO posts (title, content, tag, author, studentId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, content, tag, author, studentId, createdAt]
    );

    console.log('✅ 게시글 삽입 성공');
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('❌ 게시글 작성 오류:', err.message);
    res.status(500).json({ error: '게시글 작성 실패' });
  }
});

module.exports = router;