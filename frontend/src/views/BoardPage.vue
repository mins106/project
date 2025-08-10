<template>
  <div class="board-page">
    <!-- 상단 바 -->
    <div class="top-bar">
      <div class="logo-wrap">
        <img src="@/assets/logo.png" alt="로고" />
        <div class="logo-text">
          <div class="school-name-ko">OO중학교</div>
          <div class="school-name-en">OOO Middle School</div>
        </div>
      </div>
      <div class="right-links">
        <router-link to="/">홈</router-link> ·
        <router-link to="/login">로그인</router-link> ·
        <router-link to="/signup">회원가입</router-link>
      </div>
    </div>

    <!-- 네비게이션 메뉴 -->
    <nav class="main-nav">
      <router-link to="/meals">급식</router-link>
      <router-link to="/timetable">시간표</router-link>
      <router-link to="/calendar">학사일정</router-link>
      <router-link to="/board">자유게시판</router-link>
    </nav>

    <!-- 상단 유저 정보 -->
    <div class="user-info">
      <div class="profile-placeholder">👤</div>
      <div class="user-text">
        <template v-if="user && user.name && user.studentId">
          <div class="user-id">{{ user.studentId }}</div>
          <div class="user-name">{{ user.name }}님</div>
        </template>
        <template v-else>
          <div class="user-name">로그인을 해주세요</div>
        </template>
      </div>
    </div>

    <!-- 검색창 -->
    <div class="search-box">
      <input
        v-model="searchKeyword"
        type="text"
        placeholder="검색어를 입력하세요"
        @keyup.enter="fetchPosts"
      />
      <button class="search-btn" @click="fetchPosts">검색</button>
    </div>

    <!-- 카테고리 필터 -->
    <div class="category-filter">
      <button
        v-for="tag in tags"
        :key="tag"
        :class="{ active: selectedTag === tag }"
        @click="selectTag(tag)"
      >
        {{ tag }}
      </button>
    </div>

    <!-- 글쓰기 버튼 -->
    <router-link to="/board/write" class="write-button" title="글쓰기">
      ✏️
    </router-link>

    <!-- 게시글 목록 -->
    <div class="post-list">
      <div
        v-for="post in filteredPosts"
        :key="post.id"
        class="post-card"
        @click="$router.push(`/board/${post.id}`)"
        style="cursor: pointer"
      >
        <div class="post-header">
          <div class="best-badge" v-if="post.isBest">BEST</div>
          <div class="post-author">👤 {{ post.author }}</div>
          <div class="more-menu">⋮</div>
        </div>
        <div class="post-title">{{ post.title }}</div>
        <div class="post-content">
          {{ truncate(post.content, 100) }}
        </div>
        <div class="post-footer">
          <div class="icon">👍 {{ post.likes || 0 }}</div>
          <div class="icon">💬 {{ post.comments || 0 }}</div>
          <div class="icon">👎 {{ post.dislikes || 0 }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "BoardPage",
  data() {
    return {
      user: null,
      tags: ["전체", "모집", "공지", "홍보", "질문", "기타"],
      selectedTag: "",
      searchKeyword: "",
      posts: [],
    };
  },
  mounted() {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }

    if (sessionStorage.getItem("post_updated") === "true") {
      this.fetchPosts(); // 또는 this.loadPosts() 등 데이터 다시 불러오기
      sessionStorage.removeItem("post_updated");
    } else {
      this.fetchPosts();
    }
  },
  watch: {
    // 검색어 변경 시 서버 재요청 (디바운스)
    searchKeyword() {
      clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => {
        this.fetchPosts();
      }, 250);
    },
    // 태그 변경 시에도 목록을 최신으로 갱신(검색결과 집합 유지)
    selectedTag() {
      this.fetchPosts();
    },
  },
  computed: {
    filteredPosts() {
      // 방어 코드
      if (!Array.isArray(this.posts)) return [];

      // ✅ 검색은 서버에서 이미 수행됨. 여기서는 태그만 필터.
      if (this.selectedTag && this.selectedTag !== "전체") {
        return this.posts.filter((p) => p.tag === this.selectedTag);
      }

      return this.posts;
    },
  },
  methods: {
    selectTag(tag) {
      this.selectedTag = tag;
    },
    async fetchPosts() {
      try {
        const q = this.searchKeyword.trim();
        const res = await fetch(
          `/api/posts${q ? `?q=${encodeURIComponent(q)}` : ""}`
        );
        const data = await res.json();

        console.log("🔥 받아온 게시글 목록:", data);

        this.posts = Array.isArray(data) ? data : data.posts;
      } catch (err) {
        console.error("게시글 불러오기 실패:", err);
      }
    },
    truncate(text, max = 100) {
      if (!text) return "";
      return text.length > max ? text.slice(0, max) + "..." : text;
    },
  },
  beforeRouteEnter(to, from, next) {
    next((vm) => {
      vm.fetchPosts();
    });
  },
};
</script>

<style scoped>
.board-page {
  font-family: "Noto Sans KR", sans-serif;
  background: #f8f9fc;
  min-height: 100vh;
  padding-bottom: 3rem;
}

/* 상단 바 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
}

.logo-wrap {
  display: flex;
  align-items: center;
}

.logo-wrap img {
  width: 50px;
  height: 50px;
  margin-right: 0.5rem;
}

.logo-text .school-name-ko {
  font-weight: bold;
  font-size: 1.2rem;
}

.logo-text .school-name-en {
  font-size: 0.9rem;
  color: #555;
}

.right-links a {
  margin-left: 0.5rem;
  text-decoration: none;
  color: #444;
}

/* 네비게이션 메뉴 */
.main-nav {
  background-color: #5a2fc9;
  padding: 0.8rem 0;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.main-nav a {
  color: white;
  text-decoration: none;
  margin: 0 1.5rem;
  font-weight: 500;
}

.main-nav a.router-link-exact-active {
  text-decoration: underline;
}

/* 사용자 정보 */
.user-info {
  background: #eaf0ff;
  border-radius: 16px;
  padding: 1.2rem 1rem;
  margin: 1rem auto;
  max-width: 700px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.profile-placeholder {
  width: 60px;
  height: 60px;
  background: #cbd5e1;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28px;
  margin-right: 1rem;
}

.user-text .user-id {
  font-size: 13px;
  color: #666;
}

.user-text .user-name {
  font-size: 17px;
  font-weight: bold;
}

/* 검색창 */
.search-box {
  max-width: 700px;
  margin: 0 auto 1rem;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.search-box input {
  flex: 1;
  padding: 0.6rem 1rem;
  border-radius: 30px;
  border: 1px solid #ccc;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.search-btn {
  padding: 0.6rem 1.2rem;
  background-color: #5a2fc9;
  color: white;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s ease;
}

.search-btn:hover {
  background-color: #7c52e1;
}

/* 필터 버튼 개선 */
.category-filter {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.category-filter button {
  padding: 0.45rem 1.1rem;
  background: #e4e4f7;
  border: none;
  border-radius: 20px;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s ease;
}

.category-filter button.active {
  background: #5a2fc9;
  color: white;
}

.category-filter button:hover {
  background: #c3b9f7;
}

/* 글쓰기 버튼 (오른쪽 하단 고정) */
.write-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: #5a2fc9;
  color: white;
  font-size: 24px;
  padding: 12px 18px;
  border-radius: 50px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  text-decoration: none;
  transition: background 0.3s ease;
  z-index: 1001;
}

.write-button:hover {
  background: #7c52e1;
}

/* 게시글 목록 */
.post-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 700px;
  margin: 0 auto;
}

/* 카드 디자인 개선 */
.post-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  padding: 1.2rem;
  margin-bottom: 1.5rem;
  position: relative;
  transition: transform 0.15s ease;
}

.post-card:hover {
  transform: translateY(-2px);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.post-title {
  font-weight: 600;
  font-size: 18px;
  margin: 0.2rem 0;
}

.card-content {
  font-size: 0.92rem;
  color: #444;
  line-height: 1.6;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.icon {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  color: #777;
  margin-right: 1rem;
}

.post-footer {
  margin-top: 0.8rem;
  display: flex;
}

/* BEST 배지 */
.best-badge {
  position: absolute;
  top: -8px;
  left: -8px;
  background: #ff3b3b;
  color: white;
  font-size: 11px;
  font-weight: bold;
  padding: 3px 8px;
  border-radius: 4px;
  transform: rotate(-15deg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
