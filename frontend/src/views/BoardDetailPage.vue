<template>
  <div class="detail-page">
    <h2>{{ post.title }}</h2>
    <p><strong>작성자:</strong> {{ post.author }} ({{ post.studentId }})</p>
    <p><strong>내용:</strong></p>
    <div class="content">{{ post.content }}</div>

    <!-- 좋아요/싫어요 버튼 -->
    <div class="buttons">
      <button @click="likePost">👍 {{ post.likes }}</button>
      <button @click="dislikePost">👎 {{ post.dislikes }}</button>
    </div>

    <!-- 댓글 목록 -->
    <div class="comments">
      <h3>댓글</h3>
      <div v-for="c in post.comments" :key="c.id" class="comment">{{ c.text }}</div>
    </div>

    <!-- 댓글 입력 -->
    <div class="comment-form">
      <textarea v-model="newComment" placeholder="댓글을 입력하세요."></textarea>
      <button @click="submitComment">등록</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      post: {},
      newComment: "",
    };
  },
  mounted() {
    const postId = this.$route.params.id;
    fetch(`http://localhost:3000/api/posts/${postId}`)
      .then((res) => res.json())
      .then((data) => {
        this.post = data;
      });
  },
  methods: {
    likePost() {
      fetch(`http://localhost:3000/api/posts/${this.post.id}/like`, { method: 'POST' })
        .then(() => this.post.likes++);
    },
    dislikePost() {
      fetch(`http://localhost:3000/api/posts/${this.post.id}/dislike`, { method: 'POST' })
        .then(() => this.post.dislikes++);
    },
    submitComment() {
      if (!this.newComment.trim()) return;

      fetch(`http://localhost:3000/api/posts/${this.post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: this.newComment }),
      })
        .then(() => {
          this.post.comments.push({ text: this.newComment });
          this.newComment = '';
        });
    },
  },
};
</script>

<style scoped>
.detail-page {
  max-width: 700px;
  margin: auto;
  padding: 1rem;
  background: #fff;
  border-radius: 8px;
}
.content {
  margin: 1rem 0;
  white-space: pre-line;
}
.buttons button {
  margin-right: 1rem;
}
.comments {
  margin-top: 2rem;
}
.comment-form textarea {
  width: 100%;
  min-height: 60px;
}
</style>