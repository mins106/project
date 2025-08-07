const db = require('../db/database');

async function updateBestPosts() {
  try {
    // 먼저 모두 isBest = 0으로 초기화
    await db.run(`UPDATE posts SET isBest = 0`);

    // 좋아요 순으로 정렬, 동점 시 최신순 → 상위 3개 추출
    const bestPosts = await db.all(`
      SELECT id FROM posts
      ORDER BY likes DESC, datetime(createdAt) DESC
      LIMIT 3
    `);

    // 상위 3개의 게시글만 isBest = 1로 업데이트
    for (const post of bestPosts) {
      await db.run(`UPDATE posts SET isBest = 1 WHERE id = ?`, post.id);
    }

    console.log('✅ BEST 게시글 업데이트 완료');
  } catch (err) {
    console.error('❌ BEST 게시글 업데이트 실패:', err.message);
  }
}

module.exports = updateBestPosts;