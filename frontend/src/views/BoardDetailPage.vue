<template>
  <div v-if="post.title" class="detail-page">
    <!-- 뒤로가기 -->
    <div class="back" @click="$router.go(-1)">←</div>

    <div class="post-card">
      <!-- 태그 & 작성자 -->
      <div class="post-meta">
        <span class="post-tag">#{{ post.tag }}</span>
        <span class="post-author"
          >{{ post.author }} ({{ post.studentId }})</span
        >
      </div>

      <!-- 제목 -->
      <h1 class="post-title">{{ post.title }}</h1>

      <!-- 본문 -->
      <div class="post-content">{{ post.content }}</div>

      <!-- 좋아요 / 싫어요 -->
      <div class="reaction-buttons">
        <button @click="toggleLike" :class="{ active: liked }">
          👍 {{ post.likes || 0 }}
        </button>
        <button @click="toggleDislike" :class="{ active: disliked }">
          👎 {{ post.dislikes || 0 }}
        </button>
      </div>

      <!-- 댓글 영역 -->
      <div class="comments">
        <h2>댓글</h2>
        <!-- posts.comments(집계)가 있으면 전달해서 상단 숫자에 표시, 없으면 자동으로 rootCount를 보여줌 -->
        <CommentList
          v-if="post && post.id"
          :postId="Number(post.id)"
          :postCommentCount="post.comments"
          @refresh="fetchPost"
        />
      </div>
    </div>
  </div>

  <div v-else class="loading">불러오는 중...</div>
</template>

<script>
import CommentList from "@/components/CommentList.vue";

export default {
  name: "BoardDetailPage",
  components: { CommentList },
  data() {
    // 로그인 사용자
    let rawUser = {};
    try {
      rawUser = JSON.parse(localStorage.getItem("user")) || {};
    } catch (_) {
      rawUser = {};
    }

    // 서버가 x-user-id를 필요로 하므로, user.id가 없으면 임시로 studentId 사용
    const userId = Number.isFinite(Number(rawUser.id))
      ? Number(rawUser.id)
      : rawUser.studentId
      ? Number(rawUser.studentId)
      : null;

    return {
      post: {
        id: null,
        title: "",
        content: "",
        likes: 0,
        dislikes: 0,
        comments: [],
      },
      newComment: "",
      liked: false,
      disliked: false,
      user: rawUser,
      userId, // 헤더에 실을 값
      loading: false,
      error: "",
    };
  },

  async mounted() {
    await this.fetchPost();
  },

  methods: {
    headersWithUser() {
      const headers = {};
      if (this.userId != null) headers["x-user-id"] = this.userId; // 서버 미들웨어에서 req.user.id로 사용
      return headers;
    },

    async fetchPost() {
      try {
        this.loading = true;
        this.error = "";
        const postId = this.$route.params.id;

        const res = await fetch(`http://localhost:3000/api/posts/${postId}`, {
          headers: this.headersWithUser(),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        this.post = {
          likes: 0,
          dislikes: 0,
          comments: [],
          ...data,
        };

        // 서버가 내려준 현재 사용자 반응 상태 반영 ('like' | 'dislike' | null)
        this.liked = data.myReaction === "like";
        this.disliked = data.myReaction === "dislike";
      } catch (e) {
        console.error("게시글 불러오기 실패:", e);
        this.error = "게시글을 불러오지 못했습니다.";
      } finally {
        this.loading = false;
      }
    },

    async setReaction(next) {
      // next: 'like' | 'dislike' | 'none'
      if (!this.userId) {
        alert("⚠ 로그인 후 이용할 수 있어요.");
        return;
      }
      try {
        const res = await fetch(
          `http://localhost:3000/api/posts/${this.post.id}/reaction`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...this.headersWithUser(),
            },
            body: JSON.stringify({ reaction: next }),
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // 서버 응답으로 일관 갱신
        this.post.likes = data.likes ?? this.post.likes;
        this.post.dislikes = data.dislikes ?? this.post.dislikes;
        this.liked = data.myReaction === "like";
        this.disliked = data.myReaction === "dislike";

        // 목록 페이지 새로고침 유도 플래그
        sessionStorage.setItem("post_updated", "true");
      } catch (e) {
        console.error("반응 업데이트 실패:", e);
        alert("처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      }
    },

    toggleLike() {
      const next = this.liked ? "none" : "like";
      this.setReaction(next);
    },

    toggleDislike() {
      const next = this.disliked ? "none" : "dislike";
      this.setReaction(next);
    },

    async submitComment() {
      // 로그인 확인
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user.name || !user.studentId) {
        alert("⚠ 로그인 후 댓글을 작성할 수 있습니다.");
        return;
      }

      if (!this.newComment.trim()) return;

      try {
        const res = await fetch(
          `http://localhost:3000/api/posts/${this.post.id}/comments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: this.newComment.trim(),
              author: user.name,
              studentId: user.studentId,
            }),
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        this.post.comments.push({
          text: this.newComment.trim(),
          author: user.name,
          studentId: user.studentId,
          createdAt: new Date().toISOString(),
        });
        this.newComment = "";
      } catch (e) {
        console.error("댓글 작성 실패:", e);
        alert("댓글 작성에 실패했어요.");
      }
    },
  },

  // 라우트가 같은 컴포넌트 재사용될 수 있으니 감시
  watch: {
    "$route.params.id": {
      immediate: false,
      handler() {
        this.fetchPost();
      },
    },
  },
};
</script>

<style scoped>
.detail-page {
  max-width: 750px;
  margin: 2rem auto;
  padding: 1rem;
}

.back {
  position: fixed;
  top: 24px;
  left: 20px;
  font-size: 24px;
  cursor: pointer;
}

.post-card {
  background-color: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.post-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  color: #666;
}

.post-tag {
  background-color: #f0f0f5;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-weight: bold;
}

.post-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0.5rem 0 1rem;
  color: #333;
}

.post-content {
  font-size: 1.05rem;
  white-space: pre-line;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  color: #444;
}

.reaction-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.reaction-buttons button {
  background-color: #ece6ff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  cursor: pointer;
}

button.active {
  background-color: #d1c4e9;
}

.comments {
  border-top: 1px solid #ccc;
  padding-top: 1.5rem;
}

.comments h2 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #4a148c;
}

.comment {
  background-color: #f8f8ff;
  border-radius: 6px;
  padding: 0.6rem 1rem;
  margin-bottom: 0.5rem;
}

.no-comments {
  color: #888;
  margin-bottom: 1rem;
}

.comment-form input,
.comment-form textarea {
  width: 100%;
  margin-bottom: 0.5rem;
  padding: 0.6rem;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.comment-form textarea {
  min-height: 70px;
  resize: none;
}

.comment-form button {
  margin-top: 0.8rem;
  background-color: #7b1fa2;
  color: white;
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.comment-form button:hover {
  background-color: #6a1b9a;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #999;
}
</style>
