// backend/routes/favorites.js
const express = require('express');
const router = express.Router();
const db = require('../db/database'); // posts.js와 동일 경로

// posts.js와 동일한 임시 로그인 식별자
function getUserId(req) {
  const uid = req.header('x-user-id');
  if (!uid) return null;
  const n = Number(uid);
  return Number.isFinite(n) ? n : null;
}

/**
 * 즐겨찾기 토글
 * POST /api/posts/:id/favorite
 * header: x-user-id: <숫자>
 * 응답: { favorited: true|false }
 */
router.post('/posts/:id/favorite', async (req, res) => {
  const postId = Number(req.params.id);
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: '로그인이 필요합니다.' });

  try {
    // 게시글 존재 확인(옵션이지만 안전)
    const p = await db.get('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!p) return res.status(404).json({ error: '게시글이 존재하지 않습니다.' });

    const exist = await db.get(
      'SELECT id FROM favorites WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    if (exist) {
      await db.run('DELETE FROM favorites WHERE user_id = ? AND post_id = ?', [userId, postId]);
      return res.json({ favorited: false });
    } else {
      await db.run('INSERT INTO favorites (user_id, post_id) VALUES (?, ?)', [userId, postId]);
      return res.json({ favorited: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '즐겨찾기 처리 실패' });
  }
});

module.exports = router;