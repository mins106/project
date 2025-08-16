<template>
  <div class="comment-item" :style="{ marginLeft: depthPx }">
    <div class="meta">
      <strong>{{ comment.author || "익명" }}</strong>
      <span class="sid">({{ comment.studentId || "" }})</span>
      <span class="time">{{ fmt(comment.createdAt) }}</span>
      <span v-if="comment.updatedAt" class="edited">(수정됨)</span>
    </div>

    <!-- 본문: 맨 앞 @태그를 배지로 하이라이트 -->
    <div v-if="!editing" class="body">
      <template v-if="mentionInfo">
        <span class="mention-chip">@{{ mentionInfo.name }}</span
        >{{ mentionInfo.rest }}
      </template>
      <template v-else>
        {{ comment.text }}
      </template>
    </div>

    <!-- 수정 폼 -->
    <div v-else class="edit">
      <textarea
        ref="editBox"
        v-model="editText"
        @keydown.exact="guardEditPrefixKeydown"
        @input="guardEditPrefixInput"
        @keydown.ctrl.enter.exact.prevent="saveEdit"
      />
      <div class="row">
        <button @click="saveEdit">저장 (Ctrl+Enter)</button>
        <button @click="cancelEdit">취소</button>
      </div>
    </div>

    <div class="actions">
      <button @click="onClickReply">답글</button>
      <button v-if="isMine" @click="startEdit">수정</button>
      <button v-if="isMine" @click="remove">삭제</button>
    </div>

    <!-- 답글 작성 -->
    <div v-if="showReply" class="reply">
      <textarea
        ref="replyBox"
        v-model="replyText"
        placeholder="답글을 입력하세요"
        @keydown.exact="guardPrefixKeydown"
        @input="guardPrefixInput"
        @keydown.ctrl.enter.exact.prevent="submitReply"
      />
      <div class="row">
        <button @click="submitReply">등록 (Ctrl+Enter)</button>
        <button @click="showReply = false">닫기</button>
      </div>
    </div>

    <!-- 자식들 -->
    <div v-for="child in children" :key="child.id">
      <CommentItem
        :comment="child"
        :children="childrenMap.get(child.id) || []"
        :childrenMap="childrenMap"
        :postId="postId"
        :currentUser="currentUser"
        @refresh="$emit('refresh')"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: "CommentItem",
  props: {
    comment: { type: Object, required: true },
    children: { type: Array, default: () => [] },
    childrenMap: { type: Object, required: true }, // Map
    postId: { type: Number, required: true },
    currentUser: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      showReply: false,
      replyText: "",
      editing: false,
      editText: "",
      // 수정 모드에서 사용할 ‘고정 접두사’ (텍스트에서 추출)
      editPrefix: "",
    };
  },
  computed: {
    // 들여쓰기: 루트만 0, 그 외는 동일(첫 답글만 살짝 들여쓰기, 그 이후는 일렬)
    depthPx() {
      const d = Number(this.comment.depth || 0);
      if (d === 0) return "0px"; // 루트
      if (d === 1) return "30px"; // 첫 번째 답글만 살짝 들여쓰기
      return "0px"; // 두 번째 답글 이상은 누적 들여쓰기 없게
    },
    isMine() {
      try {
        const u = this.currentUser || {};
        return (
          !!u?.name &&
          u.name === this.comment.author &&
          !!u?.studentId &&
          u.studentId === this.comment.studentId
        );
      } catch {
        return false;
      }
    },
    // 본문에서 @이름 추출 → 배지 + 이어쓰기
    mentionInfo() {
      if (!this.comment?.text) return null;
      const m = String(this.comment.text)
        .trimStart()
        .match(/^@([^\s]+)(.*)$/);
      if (!m) return null;
      return { name: m[1], rest: m[2] };
    },
    // ✅ 답글 입력용 프리픽스 (@부모작성자 + 공백) — ‘지금 보고있는 댓글’의 작성자를 태그(=부모)
    mentionPrefix() {
      return `@${this.comment.author || "익명"} `;
    },
    prefixLen() {
      return this.mentionPrefix.length;
    },
    // ✅ 수정 시 접두사 강제 대상인지 (자기 자신 depth>=2)
    enforceEditPrefix() {
      return Number(this.comment.depth ?? 0) >= 2;
    },
    // 수정용 프리픽스 길이 (없으면 0)
    editPrefixLen() {
      return (this.editPrefix || "").length;
    },
  },
  methods: {
    fmt(ts) {
      return ts?.replace("T", " ").slice(0, 16) || "";
    },

    // ==== 답글 작성 관련 ====
    onClickReply() {
      this.showReply = !this.showReply;
      if (!this.showReply) return;

      if (this.needsAtTag()) {
        const cur = (this.replyText || "").replace(/^\s+/, "");
        if (!cur.startsWith(this.mentionPrefix)) {
          this.replyText = this.mentionPrefix + cur;
        } else {
          this.replyText = cur;
        }
      }
      this.$nextTick(() => this.setCaretAfterPrefix());
    },
    buildReplyText(raw) {
      const text = (raw || "").trim();
      if (!this.needsAtTag()) return text; // 첫 번째 답글은 태그 금지
      return text.startsWith(this.mentionPrefix)
        ? text
        : `${this.mentionPrefix}${text}`;
    },
    needsAtTag() {
      // 부모 댓글의 depth 기준
      const d = Number(this.comment.depth ?? 0);
      return d >= 1;
    },
    guardPrefixKeydown(e) {
      if (!this.needsAtTag()) return; // 첫 번째 답글은 가드 불필요
      const el = this.$refs.replyBox;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;

      if (e.key === "Backspace" && start <= this.prefixLen) {
        e.preventDefault();
        this.setCaretAfterPrefix();
        return;
      }
      if (
        e.key === "Delete" &&
        start < this.prefixLen &&
        end <= this.prefixLen
      ) {
        e.preventDefault();
        this.setCaretAfterPrefix();
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        this.setCaretAfterPrefix();
        return;
      }
      if (e.key === "ArrowLeft" && start <= this.prefixLen && start === end) {
        e.preventDefault();
        this.setCaretAfterPrefix();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
        if (start < this.prefixLen) {
          e.preventDefault();
          this.setCaretAfterPrefix();
          return;
        }
      }
    },
    guardPrefixInput() {
      if (!this.needsAtTag()) return; // 첫 번째 답글은 가드 불필요
      const el = /** @type {HTMLTextAreaElement} */ (this.$refs.replyBox);
      if (!el) return;
      if (!this.replyText.startsWith(this.mentionPrefix)) {
        const rest = this.replyText.replace(this.mentionPrefix, "");
        this.replyText = this.mentionPrefix + rest.replace(/^\s+/, "");
        this.$nextTick(() => this.setCaretAfterPrefix());
      } else {
        const pos = el.selectionStart;
        if (pos < this.prefixLen) {
          this.$nextTick(() => this.setCaretAfterPrefix());
        }
      }
    },
    setCaretAfterPrefix() {
      const el = this.$refs.replyBox;
      if (!el) return;
      try {
        el.setSelectionRange(this.prefixLen, this.prefixLen);
      } catch (e) {
        console.warn("⚠ setSelectionRange 실패:", e);
      }
    },

    async submitReply() {
      const finalText = this.buildReplyText(this.replyText);
      if (!finalText) return;

      if (!this.currentUser?.name || !this.currentUser?.studentId) {
        alert("⚠ 로그인 후 답글을 작성할 수 있습니다.");
        return;
      }
      try {
        const res = await fetch(`/api/posts/${this.postId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: finalText,
            author: this.currentUser.name,
            studentId: this.currentUser.studentId,
            parentId: this.comment.id,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        this.replyText = "";
        this.showReply = false;
        this.$emit("refresh");
      } catch (e) {
        console.error("❌ 답글 작성 실패:", e);
        alert("답글 작성 실패");
      }
    },

    // ==== 수정 관련 ====
    // 현재 텍스트에서 "@이름 " 접두사가 있으면 추출 (없으면 "")
    extractPrefixFromText(text) {
      const m = String(text || "")
        .trimStart()
        .match(/^@([^\s]+)\s+/);
      return m ? `@${m[1]} ` : "";
    },

    startEdit() {
      this.editing = true;
      const cur = this.comment.text || "";

      if (this.enforceEditPrefix) {
        // ⚠ 수정은 "원문에 있던 접두사"를 우선 고정
        const existing = this.extractPrefixFromText(cur);
        this.editPrefix = existing || this.mentionPrefix;

        if (!cur.startsWith(this.editPrefix)) {
          this.editText = this.editPrefix + cur.replace(/^\s+/, "");
        } else {
          this.editText = cur;
        }
        this.$nextTick(() => this.setEditCaretAfterPrefix());
      } else {
        // 루트/첫 번째 답글: 접두사 강제 안 함
        this.editPrefix = ""; // 고정 없음
        this.editText = cur;
        this.$nextTick(() => {
          const el = this.$refs.editBox;
          if (el) {
            try {
              el.setSelectionRange(this.editText.length, this.editText.length);
            } catch (e) {
              console.warn("editBox caret 이동 실패:", e);
            }
          }
        });
      }
    },
    cancelEdit() {
      this.editing = false;
      this.editText = "";
      this.editPrefix = "";
    },
    setEditCaretAfterPrefix() {
      const el = this.$refs.editBox;
      if (!el) return;
      try {
        el.setSelectionRange(this.editPrefixLen, this.editPrefixLen);
      } catch (e) {
        console.warn("editBox selection range 설정 실패:", e);
      }
    },
    guardEditPrefixKeydown(e) {
      if (!this.enforceEditPrefix || !this.editPrefix) return; // 대상 아닐 때 가드 X
      const el = this.$refs.editBox;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;

      if (e.key === "Backspace" && start <= this.editPrefixLen) {
        e.preventDefault();
        this.setEditCaretAfterPrefix();
        return;
      }
      if (
        e.key === "Delete" &&
        start < this.editPrefixLen &&
        end <= this.editPrefixLen
      ) {
        e.preventDefault();
        this.setEditCaretAfterPrefix();
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        this.setEditCaretAfterPrefix();
        return;
      }
      if (
        e.key === "ArrowLeft" &&
        start <= this.editPrefixLen &&
        start === end
      ) {
        e.preventDefault();
        this.setEditCaretAfterPrefix();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
        if (start < this.editPrefixLen) {
          e.preventDefault();
          this.setEditCaretAfterPrefix();
        }
      }
    },
    guardEditPrefixInput() {
      if (!this.enforceEditPrefix || !this.editPrefix) return; // 대상 아닐 때 가드 X
      const el = this.$refs.editBox;
      if (!el) return;
      if (!this.editText.startsWith(this.editPrefix)) {
        const rest = this.editText.replace(this.editPrefix, "");
        this.editText = this.editPrefix + rest.replace(/^\s+/, "");
        this.$nextTick(() => this.setEditCaretAfterPrefix());
      } else {
        const pos = el.selectionStart;
        if (pos < this.editPrefixLen) {
          this.$nextTick(() => this.setEditCaretAfterPrefix());
        }
      }
    },
    async saveEdit() {
      const text = (this.editText || "").trim();
      if (!text) return;
      if (!this.isMine) {
        alert("본인 댓글만 수정할 수 있습니다.");
        return;
      }

      // 저장 직전 접두사 보정: 자기 depth>=2일 때만, 그리고 수정용 접두사 기준으로
      const finalText =
        this.enforceEditPrefix && this.editPrefix
          ? text.startsWith(this.editPrefix)
            ? text
            : `${this.editPrefix}${text}`
          : text;

      try {
        const res = await fetch(
          `/api/posts/${this.postId}/comments/${this.comment.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: finalText }),
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        this.editing = false;
        this.editPrefix = "";
        this.$emit("refresh");
      } catch (e) {
        console.error("❌ 댓글 수정 실패:", e);
        alert("댓글 수정 실패");
      }
    },

    // ==== 삭제 ====
    async remove() {
      if (!this.isMine) {
        alert("본인 댓글만 삭제할 수 있습니다.");
        return;
      }
      if (!confirm("이 댓글을 삭제할까요? (대댓글 포함)")) return;
      try {
        const res = await fetch(
          `/api/posts/${this.postId}/comments/${this.comment.id}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        this.$emit("refresh");
      } catch (e) {
        console.error("❌ 댓글 삭제 실패:", e);
        alert("댓글 삭제 실패");
      }
    },
  },
};
</script>

<style scoped>
.comment-item {
  padding: 8px 0;
}

.meta {
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 8px;
  align-items: center;
}

.sid,
.time {
  color: #888;
}

.edited {
  color: #999;
  margin-left: 4px;
}

.body {
  white-space: pre-wrap;
  margin: 4px 0 6px;
  line-height: 1.5;
}

/* mention 하이라이트 */
.mention-chip {
  display: inline-block;
  padding: 0 8px;
  margin-right: 6px;
  border-radius: 999px;
  background: #eef2ff;
  color: #3b5bdb;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}

.reply,
.edit {
  display: grid;
  gap: 6px;
  margin: 6px 0 8px;
}

textarea {
  min-height: 64px;
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
</style>
