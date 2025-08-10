<template>
  <div class="main-page">
    <!-- 히어로 이미지 -->
    <section class="hero">
      <div class="overlay">
        <h2>
          <span class="highlight">따뜻한 인성</span>이 넘치는
          <span class="highlight2">미래 인재</span> 육성
        </h2>
        <p>우리 학교 홈페이지에 오신 것을 환영합니다.</p>
      </div>
    </section>

    <!-- BEST + MORE -->
    <section class="best-posts">
      <div class="best-header">
        <h3>BEST</h3>
        <router-link to="/board" class="more-link">MORE ➜</router-link>
      </div>

      <!-- 로딩/에러/빈/목록 -->
      <div v-if="loadingBest" class="best-skeleton">불러오는 중…</div>
      <div v-else-if="bestError" class="best-error">{{ bestError }}</div>
      <div v-else-if="!bestPosts.length" class="best-empty">
        BEST 게시글이 아직 없습니다.
      </div>

      <div v-else class="card-list">
        <div v-for="post in bestPosts" :key="post.id" class="card">
          <!-- 작성자 -->
          <div class="card-author">
            {{ post.author }}
            <span v-if="post.studentId" class="muted"
              >({{ post.studentId }})</span
            >
            <span v-if="post.tag" class="tag">#{{ post.tag }}</span>
          </div>

          <!-- 제목 -->
          <h4 class="card-title">{{ post.title }}</h4>

          <!-- 내용 -->
          <p class="card-content">
            {{ truncate(post.content, 50) }}
          </p>

          <!-- 리액션 -->
          <div class="reactions">
            👍 {{ post.likes || 0 }} 💬 {{ post.comments || 0 }} 👎
            {{ post.dislikes || 0 }}
          </div>
        </div>
      </div>
    </section>

    <!-- 규칙 -->
    <section class="rules">
      <h3>규칙</h3>
      <ul>
        <li>비난, 욕설 금지</li>
        <li>거짓 정보 공지 금지</li>
        <li>안전질서 신고</li>
      </ul>
    </section>
  </div>
</template>

<script>
export default {
  name: "MainPage",
  data() {
    return { bestPosts: [], loadingBest: true, bestError: "" };
  },
  async mounted() {
    try {
      // 프록시 쓰면 '/api/posts/best', 아니면 'http://localhost:3000/api/posts/best'
      const res = await fetch("/api/posts/best");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // 배열이면 그대로, 객체면 data.posts 시도
      this.bestPosts = Array.isArray(data) ? data : data.posts || [];
      console.log("✅ BEST 응답:", data, "→ 사용:", this.bestPosts);
    } catch (e) {
      console.error("❌ BEST 요청 실패:", e);
      this.bestError = "BEST 게시글을 불러오지 못했습니다.";
    } finally {
      this.loadingBest = false;
    }
  },
  methods: {
    truncate(text, max = 50) {
      if (!text) return "";
      return text.length > max ? text.slice(0, max) + "..." : text;
    },
  },
};
</script>

<style scoped>
.main-page {
  background: #f8f9fc;
  font-family: "Noto Sans KR", sans-serif;
  margin: 0;
}

/* 히어로 */
.hero {
  position: relative;
  height: 350px;
  background-image: url("@/assets/school.png");
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero .overlay {
  background-color: rgba(0, 0, 0, 0.45);
  padding: 2rem 3rem;
  border-radius: 20px;
  text-align: center;
  color: white;
}

.hero h2 .highlight {
  color: #d94b70;
}

.hero h2 .highlight2 {
  color: #3791ec;
}

/* BEST 카드 */
.best-posts {
  padding: 2rem 3rem;
}

.best-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.best-header h3 {
  font-size: 1.4rem;
}

.more-link {
  color: #5a2fc9;
  text-decoration: none;
  font-weight: bold;
}

.more-link:hover {
  text-decoration: underline;
}

.card-list {
  display: flex;
  flex-wrap: nowrap;
  /* 줄바꿈 없이 가로로 */
  gap: 1.2rem;
  padding-top: 1rem;
  overflow-x: auto;
  /* 가로 스크롤 가능 */
  padding-bottom: 1rem;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  min-width: 280px;
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.card-author {
  font-size: 0.92rem;
  font-weight: 600;
}

.card-author .muted {
  color: #777;
  font-weight: 400;
  margin-left: 2px;
}

.card-author .tag {
  margin-left: 6px;
  font-size: 0.86rem;
  color: #5a2fc9;
}

.card-title {
  font-size: 1.05rem;
  margin: 0.1rem 0 0.2rem;
  line-height: 1.35;
}

.card-content {
  font-size: 0.92rem;
  color: #444;
  line-height: 1.6;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.reactions {
  margin-top: 0.4rem;
  font-size: 0.92rem;
  color: #555;
}

/* 규칙 */
.rules {
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 12px;
  padding: 1.5rem 2rem;
  margin: 2rem 3rem;
}

.rules h3 {
  margin-bottom: 0.8rem;
}

.rules ul {
  padding-left: 1rem;
}

.rules li {
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.more-link {
  color: #5a2fc9;
  text-decoration: none;
  font-weight: bold;
}

.more-link:hover {
  text-decoration: underline;
}
</style>
