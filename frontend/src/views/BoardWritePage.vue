<template>
  <div class="write-page">
    <div class="content-wrapper">
      <div class="back" @click="$router.go(-1)">←</div>
      <h1 class="title">자유게시판 작성</h1>

      <!-- 제목 -->
      <div class="input-box">
        <input
          v-model="title"
          type="text"
          maxlength="30"
          placeholder="제목"
          class="title-input"
        />
        <span class="counter">{{ title.length }}/30</span>
      </div>

      <!-- 내용 -->
      <div class="textarea-box">
        <textarea
          v-model="content"
          maxlength="400"
          placeholder="내용"
          class="content-textarea"
          @input="resizeTextarea($event)"
          rows="4"
        ></textarea>
        <span class="counter">{{ content.length }}/400</span>
      </div>

      <!-- 카테고리 -->
      <div class="category-section">
        <div class="category-label">카테고리 선택</div>
        <div class="category-buttons">
          <button
            v-for="tag in tags"
            :key="tag"
            :class="{ active: selectedTag === tag }"
            @click="selectTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <!-- 이미지 업로드 : UI 리뉴얼 -->
      <section class="uploader-card">
        <header class="uploader-head">
          <div class="head-left">
            <span class="head-title">이미지 업로드</span>
            <span class="head-hint"
              >(최대 {{ maxCount }}장, 파일당 {{ maxMB }}MB)</span
            >
          </div>
          <div class="head-right">
            <span class="badge">{{ images.length }}/{{ maxCount }}</span>
          </div>
        </header>

        <!-- ImageUploader 컴포넌트 (로직 그대로) -->
        <ImageUploader
          v-model="images"
          :max-count="maxCount"
          :max-m-b="maxMB"
        />
        <p v-if="images.length" class="uploader-foot">
          선택한 이미지 <b>{{ images.length }}</b
          >장
        </p>
      </section>

      <!-- 완료 버튼 -->
      <div class="submit-box">
        <button class="submit-btn" :disabled="submitting" @click="submitPost">
          {{ submitting ? "등록 중..." : "완료" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import ImageUploader from "@/components/ImageUploader.vue";

export default {
  name: "BoardWrite",
  components: { ImageUploader },
  data() {
    return {
      title: "",
      content: "",
      selectedTag: "",
      tags: ["모집", "공지", "홍보", "질문", "기타"],
      images: [], // File[]
      maxCount: 10,
      maxMB: 8,
      submitting: false,
    };
  },
  methods: {
    selectTag(tag) {
      this.selectedTag = tag;
    },
    resizeTextarea(event) {
      const el = event.target;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    },
    async submitPost() {
      if (!this.title.trim() || !this.content.trim() || !this.selectedTag) {
        alert("모든 항목을 입력해주세요.");
        return;
      }

      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      // 이미지가 있으면 FormData, 없으면 JSON으로 보내도 됨 (기존 로직 유지)
      const fd = new FormData();
      fd.append("title", this.title.trim());
      fd.append("content", this.content.trim());
      fd.append("tag", this.selectedTag);
      fd.append("author", user.name || "익명");
      fd.append("studentId", user.studentId || "0000");
      for (const f of this.images) fd.append("images", f);

      this.submitting = true;
      try {
        const res = await fetch("http://localhost:3000/api/posts", {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "서버 응답 오류");
        }
        await res.json();
        alert("게시글이 작성되었습니다.");
        this.$router.push("/board");
      } catch (err) {
        console.error("게시글 작성 오류:", err);
        alert("오류가 발생했습니다.");
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<style scoped>
.write-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 50px;
  font-family: "Noto Sans KR", sans-serif;
  padding: 0 16px;
}

.content-wrapper {
  width: 100%;
  max-width: 640px;
}

/* 뒤로가기 */
.back {
  position: fixed;
  top: 24px;
  left: 20px;
  font-size: 24px;
  cursor: pointer;
}

/* 제목 */
.title {
  font-size: 26px;
  font-weight: bold;
  margin-bottom: 2rem;
  text-align: center;
}

/* 제목 입력 */
.title-input {
  width: 100%;
  border: 1px solid #dfe1e6;
  border-radius: 12px;
  padding: 1rem;
  font-size: 16px;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.title-input:focus {
  border-color: #6b5bff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(107, 91, 255, 0.15);
}

/* 내용 입력 */
.content-textarea {
  width: 100%;
  border: 1px solid #dfe1e6;
  border-radius: 12px;
  padding: 1rem;
  font-size: 16px;
  line-height: 1.6;
  resize: none;
  box-sizing: border-box;
  min-height: 120px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.content-textarea:focus {
  border-color: #6b5bff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(107, 91, 255, 0.15);
}

.input-box,
.textarea-box {
  position: relative;
  margin-bottom: 1.5rem;
}

.counter {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 12px;
  color: #8a8f9a;
}

/* 카테고리 */
.category-section {
  border: 1px solid #e6e8f0;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 2rem;
  background: #fff;
}

.category-label {
  margin-bottom: 0.6rem;
  font-weight: 700;
  font-size: 15px;
}

.category-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category-buttons button {
  padding: 0.5rem 1.2rem;
  border-radius: 999px;
  border: 1px solid #dfe1e6;
  font-size: 14px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.category-buttons button:hover {
  background-color: #f4f6ff;
}

.category-buttons button.active {
  background: #6b5bff;
  color: #fff;
  border-color: #6b5bff;
}

/* ===== 업로더 카드 (UI만 변경) ===== */
.uploader-card {
  border: 1px solid #e6e8f0;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
  margin-bottom: 2rem;
  box-shadow: 0 4px 18px rgba(25, 28, 33, 0.04);
}

.uploader-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.head-left {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.head-title {
  font-weight: 700;
}

.head-hint {
  font-size: 12px;
  color: #8a8f9a;
}

.head-right .badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: #4f46e5;
  background: #eef2ff;
  border: 1px solid #dfe3ff;
}

.uploader-foot {
  margin-top: 10px;
  font-size: 13px;
  color: #666;
}

/* 완료 버튼 */
.submit-box {
  width: 100%;
  margin-bottom: 2rem;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  font-size: 16px;
  background-color: #6b5bff;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(107, 91, 255, 0.25);
  transition: transform 0.06s ease, background 0.2s;
}

.submit-btn:hover {
  background-color: #7d6fff;
}

.submit-btn:active {
  transform: translateY(1px);
}
</style>
