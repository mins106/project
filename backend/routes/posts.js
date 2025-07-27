const express = require('express');
const router = express.Router();
const db = require('../db/database'); // db 연결

// ✅ 글 목록 조회
router.get('/', (req, res) => {
  db.all('SELECT * FROM posts ORDER BY createdAt DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ✅ 글 저장
router.post('/', (req, res) => {
  const { title, content, tag, author, studentId, createdAt } = req.body;

  const query = `
    INSERT INTO posts (title, content, tag, author, studentId, createdAt, likes, dislikes, comments, views, isBest)
    VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0)
  `;
  const params = [title, content, tag, author, studentId, createdAt];

  db.run(query, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// 좋아요
router.post('/:id/like', (req, res) => {
  const id = req.params.id;
  db.run('UPDATE posts SET likes = likes + 1 WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    db.get('SELECT likes FROM posts WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ likes: row.likes });
    });
  });
});

router.post('/:id/unlike', (req, res) => {
  const id = req.params.id;
  db.run('UPDATE posts SET likes = likes - 1 WHERE id = ? AND likes > 0', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    // ✅ 변경 후 좋아요 수 반환
    db.get('SELECT likes FROM posts WHERE id = ?', [id], (err2, row) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ likes: row.likes });
    });
  });
});

// ✅ 싫어요
app.post("/api/posts/:id/dislike", (req, res) => {
  const id = req.params.id;
  db.run("UPDATE posts SET dislikes = dislikes + 1 WHERE id = ?", [id]);
  res.sendStatus(200);
});

// ✅ 싫어요 취소
app.post("/api/posts/:id/undislike", (req, res) => {
  const id = req.params.id;
  db.run("UPDATE posts SET dislikes = dislikes - 1 WHERE id = ?", [id]);
  res.sendStatus(200);
});

// ✅ 댓글 등록
router.post('/:id/comments', (req, res) => {
  const postId = req.params.id;
  const { text } = req.body;

  const query = `INSERT INTO comments (postId, text) VALUES (?, ?)`;
  db.run(query, [postId, text], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    // 댓글 수 증가
    db.run('UPDATE posts SET comments = comments + 1 WHERE id = ?', [postId]);
    res.json({ id: this.lastID });
  });
});

// ✅ 글 상세 조회
router.get('/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM posts WHERE id = ?', [id], (err, post) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!post) return res.status(404).json({ error: '게시글이 존재하지 않습니다.' });

    // 댓글도 함께 가져오기
    db.all('SELECT * FROM comments WHERE postId = ?', [id], (err2, comments) => {
      if (err2) return res.status(500).json({ error: err2.message });
      post.comments = comments;
      res.json(post);
    });
  });
});

module.exports = router;
