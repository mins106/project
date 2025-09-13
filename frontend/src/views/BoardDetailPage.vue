<template>
  <div v-if="post.title" class="detail-page">
    <!-- 상단 고정 바 -->
    <div class="top-bar">
      <button class="back-btn" @click="$router.go(-1)">← 뒤로가기</button>
    </div>

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

      <!-- 이미지 그리드 -->
      <div v-if="post.images && post.images.length" class="img-grid">
        <img
          v-for="(img, i) in post.images"
          :key="img.id ?? i"
          :src="imgUrl(img.url)"
          alt=""
          loading="lazy"
          class="zoomable"
          @error="onImgError"
          @click.stop="openLightbox(i)"
        />
      </div>

      <!-- ✅ 라이트박스 -->
      <div v-if="lightbox.open" class="lightbox" @click.self="closeLightbox">
        <button
          class="lb-btn close"
          @click.stop="closeLightbox"
          aria-label="닫기"
        >
          ✕
        </button>
        <button class="lb-btn prev" @click.stop="prevImage" aria-label="이전">
          ‹
        </button>

        <img
          v-if="currentImage"
          :src="imgUrl(currentImage.url)"
          alt=""
          class="lb-img"
          @error="onImgError"
        />

        <button class="lb-btn next" @click.stop="nextImage" aria-label="다음">
          ›
        </button>
        <div class="lb-counter">
          {{ lightbox.index + 1 }} / {{ post.images.length }}
        </div>
      </div>

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
import api from "@/utils/api";

export default {
  name: "BoardDetailPage",
  components: { CommentList },

  data() {
    // 로그인 사용자(UX 용도)
    let rawUser = {};
    try {
      rawUser = JSON.parse(localStorage.getItem("user")) || {};
    } catch (e) {
      rawUser = {}; /* noop */
    }

    return {
      post: {
        id: null,
        title: "",
        content: "",
        tag: "",
        author: "",
        studentId: "",
        likes: 0,
        dislikes: 0,
        comments: 0,
        images: [],
      },
      newComment: "",
      liked: false,
      disliked: false,
      user: rawUser,
      loading: false,
      error: "",
      lightbox: { open: false, index: 0 },
    };
  },

  computed: {
    currentImage() {
      const images = Array.isArray(this.post?.images) ? this.post.images : [];
      const i = Number.isInteger(this.lightbox?.index)
        ? this.lightbox.index
        : 0;
      return images[i] || null;
    },
  },

  async mounted() {
    await this.fetchPost();
    window.addEventListener("keydown", this.onKey);
  },

  beforeUnmount() {
    window.removeEventListener("keydown", this.onKey);
    if (this.lightbox.open) document.body.style.overflow = "";
  },

  methods: {
    imgUrl(path) {
      if (!path) return "";
      if (/^https?:\/\//i.test(path)) return path;

      const p = path.startsWith("/uploads/")
        ? path
        : path.startsWith("/")
        ? path
        : `/uploads/${path}`;

      const base = process.env.VUE_APP_API_BASE || "";
      return base ? `${base.replace(/\/$/, "")}${p}` : p;
    },

    async fetchPost() {
      try {
        this.loading = true;
        this.error = "";

        const postId = this.$route.params.id;
        const { data } = await api.get(`/api/posts/${postId}`);

        // ✅ 중복 키 없이 병합
        this.post = {
          id: null,
          title: "",
          content: "",
          tag: "",
          author: "",
          studentId: "",
          likes: 0,
          dislikes: 0,
          comments: 0,
          images: [],
          ...data, // 서버 응답 덮어쓰기
        };

        // ✅ 안전 보정
        this.post.comments = Number.isFinite(Number(this.post.comments))
          ? Number(this.post.comments)
          : 0;
        this.post.images = Array.isArray(this.post.images)
          ? this.post.images
          : [];

        // 현재 사용자 반응 상태
        this.liked = data.myReaction === "like";
        this.disliked = data.myReaction === "dislike";
      } catch (e) {
        console.error("게시글 불러오기 실패:", e);
        if (e?.response?.status === 401) {
          alert("로그인이 필요합니다.");
          this.$router.push("/login");
          return;
        }
        this.error = "게시글을 불러오지 못했습니다.";
      } finally {
        this.loading = false;
      }
    },

    async setReaction(next) {
      try {
        const { data } = await api.post(`/api/posts/${this.post.id}/reaction`, {
          reaction: next,
        });
        this.post.likes = data.likes ?? this.post.likes;
        this.post.dislikes = data.dislikes ?? this.post.dislikes;
        this.liked = data.myReaction === "like";
        this.disliked = data.myReaction === "dislike";
        sessionStorage.setItem("post_updated", "true");
      } catch (e) {
        console.error("반응 업데이트 실패:", e);
        if (e?.response?.status === 401) {
          alert("로그인이 필요합니다.");
          this.$router.push("/login");
        } else {
          alert("처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        }
      }
    },

    toggleLike() {
      this.setReaction(this.liked ? "none" : "like");
    },

    toggleDislike() {
      this.setReaction(this.disliked ? "none" : "dislike");
    },

    async submitComment() {
      if (!this.newComment.trim()) return;

      try {
        await api.post(`/api/posts/${this.post.id}/comments`, {
          text: this.newComment.trim(),
        });
        // 댓글 수만 증가(목록은 CommentList에서 갱신)
        this.post.comments = (this.post.comments || 0) + 1;
        this.newComment = "";
      } catch (e) {
        console.error("댓글 작성 실패:", e);
        if (e?.response?.status === 401) {
          alert("로그인이 필요합니다.");
          this.$router.push("/login");
        } else {
          alert("댓글 작성에 실패했어요.");
        }
      }
    },

    onImgError(e) {
      e.target.style.opacity = 0.2;
      e.target.alt = "이미지를 불러올 수 없습니다";
    },

    openLightbox(i = 0) {
      const len = Array.isArray(this.post?.images)
        ? this.post.images.length
        : 0;
      if (!len) return;
      this.lightbox.index = Math.min(Math.max(i, 0), len - 1);
      this.lightbox.open = true;
      document.body.style.overflow = "hidden";
    },

    closeLightbox() {
      this.lightbox.open = false;
      document.body.style.overflow = "";
    },

    nextImage() {
      const len = Array.isArray(this.post?.images)
        ? this.post.images.length
        : 0;
      if (!len) return;
      this.lightbox.index = (this.lightbox.index + 1) % len;
    },

    prevImage() {
      const len = Array.isArray(this.post?.images)
        ? this.post.images.length
        : 0;
      if (!len) return;
      this.lightbox.index = (this.lightbox.index - 1 + len) % len;
    },

    onKey(e) {
      if (!this.lightbox.open) return;
      if (e.key === "Escape") this.closeLightbox();
      else if (e.key === "ArrowRight") this.nextImage();
      else if (e.key === "ArrowLeft") this.prevImage();
    },
  },

  watch: {
    "$route.params.id"() {
      this.fetchPost();
    },
  },
};
</script>

<style scoped>
.detail-page {
  max-width: 750px;
  margin: 4rem auto 2rem;
  padding: 1rem;
}

.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: #fff;
  border-bottom: 1px solid #ddd;
  padding: 20px 20px;
  display: flex;
  align-items: center;
  z-index: 1000;
}

.back-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #333;
  font-weight: bold;
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
  margin-bottom: 1rem;
  color: #444;
}

/* ✅ 이미지 그리드 */
.zoomable {
  cursor: zoom-in;
}

.img-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  margin-bottom: 1.25rem;
}

.img-grid img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 10px;
  background: #f2f2f7;
}

/* 라이트박스 오버레이 */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.85);
  display: grid;
  place-items: center;
  padding: 24px;
}

.lb-img {
  max-width: 92vw;
  max-height: 92vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  cursor: zoom-out;
}

.lb-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  font-size: 36px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  cursor: pointer;
  user-select: none;
}

.lb-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.lb-btn.prev {
  left: 16px;
}

.lb-btn.next {
  right: 16px;
}

.lb-btn.close {
  top: 16px;
  right: 16px;
  transform: none;
  font-size: 24px;
  width: 40px;
  height: 40px;
}

.lb-counter {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  font-size: 13px;
  opacity: 0.85;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 10px;
  border-radius: 999px;
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

.loading {
  text-align: center;
  padding: 3rem;
  color: #999;
}
</style>
