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

        <div v-if="post.comments && post.comments.length">
          <div v-for="(c, i) in post.comments" :key="i" class="comment">
            <strong>{{ c.author }} ({{ c.studentId }})</strong><br />
            {{ c.text }}
          </div>
        </div>
        <div v-else class="no-comments">아직 댓글이 없습니다.</div>

        <div class="comment-form">
          <textarea
            v-model="newComment"
            placeholder="댓글을 입력하세요"
          ></textarea>
          <button @click="submitComment">등록</button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="loading">불러오는 중...</div>
</template>

<script>
export default {
  name: "BoardDetailPage",
  data() {
    let user = {};
    try {
      user = JSON.parse(localStorage.getItem("user")) || {};
    } catch (e) {
      user = {};
    }

    return {
      post: {},
      newComment: "",
      liked: false,
      disliked: false,
      originalLiked: false,
      originalDisliked: false,
      currentUser: {
        author: user.name || "익명",
        studentId: user.studentId || "",
      },
    };
  },
  mounted() {
    const postId = this.$route.params.id;
    fetch(`http://localhost:3000/api/posts/${postId}`)
      .then((res) => res.json())
      .then((data) => {
        this.post = {
          likes: 0,
          dislikes: 0,
          comments: [],
          ...data,
        };
        this.liked = localStorage.getItem(`liked_${postId}`) === "true";
        this.disliked = localStorage.getItem(`disliked_${postId}`) === "true";
        this.originalLiked = this.liked;
        this.originalDisliked = this.disliked;
      })
      .catch((err) => {
        console.error("게시글 불러오기 실패:", err);
      });
  },
  beforeRouteLeave(to, from, next) {
    const id = this.post.id;
    const promises = [];

    const likeChanged = this.originalLiked !== this.liked;
    const dislikeChanged = this.originalDisliked !== this.disliked;

    if (likeChanged) {
      const endpoint = this.liked ? "like" : "unlike";
      promises.push(
        fetch(`http://localhost:3000/api/posts/${id}/${endpoint}`, {
          method: "POST",
        })
      );
    }

    if (dislikeChanged) {
      const endpoint = this.disliked ? "dislike" : "undislike";
      promises.push(
        fetch(`http://localhost:3000/api/posts/${id}/${endpoint}`, {
          method: "POST",
        })
      );
    }

    Promise.all(promises).finally(() => {
      if (likeChanged || dislikeChanged) {
        sessionStorage.setItem("post_updated", "true");
      }
      next();
    });
  },
  methods: {
    toggleLike() {
      if (this.liked) {
        this.post.likes--;
        this.liked = false;
        localStorage.setItem(`liked_${this.post.id}`, "false");
      } else {
        this.post.likes++;
        this.liked = true;
        localStorage.setItem(`liked_${this.post.id}`, "true");
        if (this.disliked) {
          this.post.dislikes--;
          this.disliked = false;
          localStorage.setItem(`disliked_${this.post.id}`, "false");
        }
      }
    },
    toggleDislike() {
      if (this.disliked) {
        this.post.dislikes--;
        this.disliked = false;
        localStorage.setItem(`disliked_${this.post.id}`, "false");
      } else {
        this.post.dislikes++;
        this.disliked = true;
        localStorage.setItem(`disliked_${this.post.id}`, "true");
        if (this.liked) {
          this.post.likes--;
          this.liked = false;
          localStorage.setItem(`liked_${this.post.id}`, "false");
        }
      }
    },
    submitComment() {
      // 사용자 정보 확인
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!user.name || !user.studentId) {
        alert("⚠ 로그인 후 댓글을 작성할 수 있습니다.");
        return;
      }

      if (!this.newComment.trim()) return;

      fetch(`http://localhost:3000/api/posts/${this.post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: this.newComment,
          author: user.name,
          studentId: user.studentId,
        }),
      }).then(() => {
        this.post.comments.push({
          text: this.newComment,
          author: user.name,
          studentId: user.studentId,
        });
        this.newComment = "";
      });
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
