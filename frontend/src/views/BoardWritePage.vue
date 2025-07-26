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

      <!-- 완료 버튼 -->
      <div class="submit-box">
        <button class="submit-btn" @click="submitPost">완료</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "BoardWrite",
  data() {
    return {
      title: "",
      content: "",
      selectedTag: "",
      tags: ["모집", "공지", "홍보", "질문", "기타"],
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
    submitPost() {
      if (!this.title || !this.content || !this.selectedTag) {
        alert("모든 항목을 입력해주세요.");
        return;
      }

      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      // 서버로 보낼 게시글 데이터
      const postData = {
        title: this.title,
        content: this.content,
        tag: this.selectedTag,
        author: user.name || "익명",
        studentId: user.studentId || "0000",
        createdAt: new Date().toISOString(),
      };

      fetch("http://localhost:3000/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData), // ✅ 실제 사용
      })
        .then((res) => {
          if (!res.ok) throw new Error("서버 응답 오류");
          return res.json();
        })
        .then(() => {
          alert("게시글이 작성되었습니다.");
          this.$router.push("/board");
        })
        .catch((err) => {
          console.error("게시글 작성 오류:", err);
          alert("오류가 발생했습니다.");
        });
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
  max-width: 600px;
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
  border: 1px solid #ccc;
  border-radius: 12px;
  padding: 1rem;
  font-size: 16px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.title-input:focus {
  border-color: #5a2fc9;
  outline: none;
}

/* 내용 입력 */
.content-textarea {
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 12px;
  padding: 1rem;
  font-size: 16px;
  line-height: 1.6;
  resize: none;
  box-sizing: border-box;
  min-height: 120px;
  transition: border-color 0.2s;
}

.content-textarea:focus {
  border-color: #5a2fc9;
  outline: none;
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
  color: #888;
}

/* 카테고리 */
.category-section {
  border: 1px solid #ccc;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 2rem;
}

.category-label {
  margin-bottom: 0.6rem;
  font-weight: bold;
  font-size: 15px;
}

.category-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category-buttons button {
  padding: 0.5rem 1.2rem;
  border-radius: 20px;
  border: 1px solid #ccc;
  font-size: 14px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.category-buttons button:hover {
  background-color: #f2f2f2;
}

.category-buttons button.active {
  background-color: #5a2fc9;
  color: white;
  border: none;
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
  background-color: #5a2fc9;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(90, 47, 201, 0.25);
  transition: background-color 0.2s;
}

.submit-btn:hover {
  background-color: #734be1;
}
</style>
