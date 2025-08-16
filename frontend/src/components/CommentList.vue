<template>
  <section class="comment-list">
    <h3>
      댓글 <span class="count">{{ postCommentCount ?? rootCount }}</span>
    </h3>

    <!-- 새 댓글 작성 -->
    <div class="new-comment">
      <textarea
        v-model="newContent"
        placeholder="댓글을 입력하세요 (Ctrl+Enter로 등록)"
        @keydown.ctrl.enter.prevent="submitRoot"
      />
      <div class="row">
        <button @click="submitRoot">등록</button>
      </div>
    </div>

    <!-- 댓글 트리 -->
    <div v-if="roots.length" class="tree">
      <CommentItem
        v-for="c in roots"
        :key="c.id"
        :comment="c"
        :children="childrenMap.get(c.id) || []"
        :childrenMap="childrenMap"
        :postId="postId"
        :currentUser="currentUser"
        @refresh="refreshAll"
      />
    </div>
    <div v-else class="no-comments">아직 댓글이 없습니다.</div>
  </section>
</template>

<script>
import CommentItem from "./CommentItem.vue";

export default {
  name: "CommentList",
  components: { CommentItem },
  props: {
    postId: { type: Number, required: true },
    /** 선택: 상단에 표시할 집계 숫자(게시글 객체의 posts.comments). 없으면 rootCount 출력 */
    postCommentCount: { type: Number, default: null },
  },
  data() {
    return {
      flat: [], // 서버에서 depth 포함 평탄 리스트
      newContent: "",
      loading: false,
      error: "",
      currentUser: {}, // localStorage user
    };
  },
  computed: {
    childrenMap() {
      const map = new Map();
      this.flat.forEach((c) => {
        const pid = c.parentId ?? 0;
        if (!map.has(pid)) map.set(pid, []);
        map.get(pid).push(c);
      });
      // 같은 부모 내 시간순
      for (const arr of map.values()) {
        arr.sort((a, b) =>
          String(a.createdAt).localeCompare(String(b.createdAt))
        );
      }
      return map;
    },
    roots() {
      return this.childrenMap.get(0) || [];
    },
    rootCount() {
      return (this.childrenMap.get(0) || []).length;
    },
  },
  mounted() {
    try {
      this.currentUser = JSON.parse(localStorage.getItem("user") || "{}") || {};
    } catch {
      this.currentUser = {};
    }
    this.fetchComments();
  },
  methods: {
    async fetchComments() {
      this.loading = true;
      this.error = "";
      try {
        const res = await fetch(`/api/posts/${this.postId}/comments`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.flat = Array.isArray(data.comments) ? data.comments : [];
      } catch (e) {
        console.error("❌ 댓글 목록 실패:", e);
        this.error = "댓글을 불러오지 못했습니다.";
      } finally {
        this.loading = false;
      }
    },
    async submitRoot() {
      const text = this.newContent.trim();
      if (!text) return;

      // 로그인 확인(프로젝트 정책에 맞게 조정)
      if (!this.currentUser?.name || !this.currentUser?.studentId) {
        alert("⚠ 로그인 후 댓글을 작성할 수 있습니다.");
        return;
      }

      try {
        const res = await fetch(`/api/posts/${this.postId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            author: this.currentUser.name,
            studentId: this.currentUser.studentId,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        this.newContent = "";
        await this.refreshAll();
      } catch (e) {
        console.error("❌ 댓글 작성 실패:", e);
        alert("댓글 작성에 실패했습니다.");
      }
    },
    async refreshAll() {
      await this.fetchComments();
      // 부모(상위 페이지)에게도 알림이 필요하면 이벤트 emit
      this.$emit("refresh"); // BoardDetail에서 posts.comments 재갱신 시 사용 가능
    },
  },
};
</script>

<style scoped>
.comment-list {
  margin-top: 16px;
}

h3 {
  font-size: 1.1rem;
  margin: 12px 0;
}

.count {
  color: #777;
  font-weight: 600;
}

.new-comment {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 12px;
}

textarea {
  min-height: 72px;
  padding: 8px;
  resize: vertical;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.row {
  display: flex;
  gap: 8px;
}

button {
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid #ddd;
  background: #fafafa;
  cursor: pointer;
}

.no-comments {
  color: #888;
}
</style>
