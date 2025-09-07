<template>
  <div class="board-page">
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
    <div class="category-filter tag-scroll">
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
        class="post-card row"
        @click="$router.push(`/board/${post.id}`)"
        style="cursor: pointer"
      >
        <div class="col text">
          <div class="post-header">
            <div class="best-badge" v-if="post.isBest">BEST</div>
            <div class="post-author">👤 {{ post.author }}</div>
            <button
              v-if="canEdit(post)"
              class="more-menu"
              @click.stop="toggleMenu(post.id)"
              aria-label="세부사항"
            >
              ⋮
            </button>
            <div
              v-if="menuOpenId === post.id && canEdit(post)"
              class="popover"
              @click.stop
            >
              <button @click.stop="confirmDelete(post)">🗑️ 삭제</button>
            </div>
          </div>
          <div class="post-title">{{ post.title }}</div>
          <div class="post-content">{{ truncate(post.content, 100) }}</div>
          <div class="post-footer">
            <div class="icon">👍 {{ post.likes || 0 }}</div>
            <div class="icon">💬 {{ post.comments || 0 }}</div>
            <div class="icon">👎 {{ post.dislikes || 0 }}</div>
          </div>
        </div>
        <div class="col thumb-col" v-if="post.thumbnail">
          <img
            :src="imgUrl(post.thumbnail)"
            alt="thumb"
            class="thumb-small"
            loading="lazy"
          />
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
      menuOpenId: null,
    };
  },
  mounted() {
    const storedUser = localStorage.getItem("user");
    if (storedUser) this.user = JSON.parse(storedUser);

    if (sessionStorage.getItem("post_updated") === "true") {
      this.fetchPosts();
      sessionStorage.removeItem("post_updated");
    } else {
      this.fetchPosts();
    }
    window.addEventListener("click", this.closeMenu);
  },
  beforeUnmount() {
    window.removeEventListener("click", this.closeMenu);
  },
  watch: {
    searchKeyword() {
      clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => this.fetchPosts(), 250);
    },
    selectedTag() {
      this.fetchPosts();
    },
  },
  computed: {
    filteredPosts() {
      if (!Array.isArray(this.posts)) return [];
      if (this.selectedTag && this.selectedTag !== "전체") {
        return this.posts.filter((p) => p.tag === this.selectedTag);
      }
      return this.posts;
    },
  },
  methods: {
    imgUrl(path) {
      if (!path) return "";
      if (/^https?:\/\//i.test(path)) return path;

      let p = path.startsWith("/uploads/")
        ? path
        : path.startsWith("/")
        ? path
        : `/uploads/${path}`;

      const base = process.env.VUE_APP_API_BASE || "";
      return base ? `${base.replace(/\/$/, "")}${p}` : p;
    },
    canEdit(post) {
      const norm = (v) => String(v ?? "").trim();
      const uName = norm(this.user?.name),
        uSid = norm(this.user?.studentId);
      const pName = norm(post?.author),
        pSid = norm(post?.studentId);
      if (!uName || !pName) return false;
      if (uName === pName && uSid && pSid && uSid === pSid) return true;
      if (uName === pName && (!uSid || !pSid)) return true;
      return false;
    },
    toggleMenu(id) {
      this.menuOpenId = this.menuOpenId === id ? null : id;
    },
    closeMenu() {
      this.menuOpenId = null;
    },
    async confirmDelete(post) {
      this.closeMenu();
      if (!confirm("정말 삭제할까요?")) return;
      try {
        const res = await fetch(`/api/posts/${post.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authorName: this.user?.name || "",
            studentId: this.user?.studentId || "",
          }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.error || `HTTP ${res.status}`);
        }
        this.posts = this.posts.filter((p) => p.id !== post.id);
      } catch (err) {
        alert("삭제 실패: " + err.message);
      }
    },
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
        // 서버가 thumbnail 필드를 추가로 줌
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
    next((vm) => vm.fetchPosts());
  },
};
</script>

<style scoped>
.board-page {
  font-family: "Noto Sans KR", sans-serif;
  background: #f8f9fc;
  min-height: 100vh;
  padding: 0 12px 3.5rem;
}

/* 사용자 정보 */
.user-info {
  background: #eaf0ff;
  border-radius: 16px;
  padding: 1.1rem 1rem;
  margin: 12px auto;
  max-width: 820px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.profile-placeholder {
  width: 56px;
  height: 56px;
  background: #cbd5e1;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 26px;
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
  max-width: 820px;
  margin: 0 auto 12px;
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  align-items: center;
}

.search-box input {
  flex: 1;
  min-width: 0;
  height: 42px;
  padding: 0 14px;
  border-radius: 30px;
  border: 1px solid #ccc;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.search-btn {
  flex-shrink: 0;
  height: 42px;
  padding: 0 16px;
  border-radius: 30px;
  border: 0;
  background: #5a2fc9;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.search-btn:hover {
  background-color: #7c52e1;
}

/* 필터 */
.category-filter {
  justify-content: center;
  gap: 8px;
  margin: 8px auto 18px;
  max-width: 820px;
}

.tag-scroll {
  display: flex;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 6px 2px 10px;
}

.category-filter button {
  flex: 0 0 auto;
  padding: 9px 14px;
  background: #e4e4f7;
  border: 0;
  border-radius: 999px;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;
  white-space: nowrap;
}

.category-filter button.active {
  background: #5a2fc9;
  color: white;
}

.category-filter button:hover {
  background: #c3b9f7;
}

/* 글쓰기 버튼 */
.write-button {
  position: fixed;
  bottom: max(16px, env(safe-area-inset-bottom) + 12px);
  right: 18px;
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  background: #5a2fc9;
  color: #fff;
  font-size: 22px;
  border-radius: 50%;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
  text-decoration: none;
  z-index: 1001;
}

.write-button:hover {
  background: #7c52e1;
}

/* 목록 */
.post-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 700px;
  margin: 0 auto;
}

/* 카드 */
.post-card {
  background: #fff;
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

.post-card.row {
  display: grid;
  grid-template-columns: 1fr 110px;
  /* 왼쪽 내용 / 오른쪽 썸네일 */
  gap: 12px;
  align-items: center;
}

.thumb-col {
  display: flex;
  justify-content: flex-end;
}

.thumb-small {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 12px;
  background: #f2f2f7;
}

.thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.more-menu {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 20;
  background: transparent;
  border: 0;
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
  padding: 2px 6px;
}

.popover {
  position: absolute;
  top: 34px;
  right: 10px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  min-width: 120px;
  z-index: 30;
}

.popover > button {
  padding: 10px 14px;
  text-align: left;
  border: 0;
  background: none;
  cursor: pointer;
}

.popover > button:hover {
  background: #f6f6f7;
}

.post-title {
  font-weight: 600;
  font-size: 18px;
  margin: 0.2rem 0;
}

.post-content {
  display: -webkit-box;
  overflow: hidden;
  line-height: 1.5;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-size: clamp(13px, 3.6vw, 15px);
  color: #444;
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
  margin-top: 10px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

/* BEST 배지 */
.best-badge {
  position: absolute;
  top: -12px;
  left: -6px;
  background: #ff4d6d;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 6px;
  transform: rotate(-12deg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
  pointer-events: none;
}

@media (max-width: 420px) {
  .board-page {
    padding: 0 10px 80px;
  }

  .user-info {
    border-radius: 14px;
  }

  .post-card {
    border-radius: 14px;
    padding: 12px;
  }

  .write-button {
    right: 14px;
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
}
</style>
