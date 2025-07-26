const express = require('express');
const router = express.Router();
const db = require('../db/database'); // db.js에서 SQLite 연결

// 글 저장
router.post('/', (req, res) => {
  const { title, content, tag, author, studentId, createdAt } = req.body;

  const query = `
    INSERT INTO posts (title, content, tag, author, studentId, createdAt, likes, comments, views, isBest)
    VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0)
  `;
  const params = [title, content, tag, author, studentId, createdAt];

  db.run(query, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// 글 목록 조회
router.get('/', (req, res) => {
  db.all('SELECT * FROM posts ORDER BY createdAt DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;