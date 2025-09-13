<template>
  <div class="mypage-wrap">
    <!-- 헤더 카드 -->
    <section class="profile-card">
      <div class="pf-left">
        <div class="avatar" :style="avatarStyle">{{ avatarInitial }}</div>
        <div class="who">
          <div class="name">{{ me.name || "이름 없음" }}</div>
          <div class="sid">학번 {{ me.studentId || "-" }}</div>
        </div>
      </div>

      <ul class="counts">
        <li>
          <span class="num">{{ me.counts.posts }}</span
          ><span class="lbl">내 글</span>
        </li>
        <li>
          <span class="num">{{ me.counts.comments }}</span
          ><span class="lbl">댓글</span>
        </li>
        <li>
          <span class="num">{{ me.counts.favorites }}</span
          ><span class="lbl">즐겨찾기</span>
        </li>
      </ul>
    </section>

    <!-- 탭 -->
    <div class="segmented">
      <button :class="{ active: tab === 'posts' }" @click="switchTab('posts')">
        내 글
      </button>
      <button
        :class="{ active: tab === 'comments' }"
        @click="switchTab('comments')"
      >
        댓글
      </button>
      <button
        :class="{ active: tab === 'favorites' }"
        @click="switchTab('favorites')"
      >
        즐겨찾기
      </button>
      <button
        :class="{ active: tab === 'settings' }"
        @click="switchTab('settings')"
      >
        설정
      </button>
    </div>

    <!-- 컨텐츠 -->
    <section v-if="tab === 'posts'">
      <ListPanel
        title="내가 쓴 글"
        :items="posts.items"
        :loading="loading.posts"
        empty-text="작성한 글이 없어요."
        :has-more="posts.hasMore"
        @load-more="loadPosts"
      />
    </section>

    <section v-else-if="tab === 'comments'">
      <ListPanel
        title="내가 단 댓글"
        :items="comments.items"
        :loading="loading.comments"
        empty-text="작성한 댓글이 없어요."
        :has-more="comments.hasMore"
        @load-more="loadComments"
      />
    </section>

    <section v-else-if="tab === 'favorites'">
      <ListPanel
        title="즐겨찾기한 글"
        :items="favs.items"
        :loading="loading.favs"
        empty-text="즐겨찾기한 글이 없어요."
        :has-more="favs.hasMore"
        @load-more="loadFavs"
      />
    </section>

    <section v-else class="settings">
      <h2>설정</h2>
      <form @submit.prevent="saveProfile" class="form">
        <label>
          <span>이름</span>
          <input v-model="form.name" placeholder="이름" />
        </label>

        <label>
          <span>새 비밀번호</span>
          <input
            v-model="form.newPassword"
            type="password"
            placeholder="변경 시 입력"
          />
        </label>

        <div class="actions">
          <button type="submit" :disabled="saving">
            {{ saving ? "저장 중…" : "저장" }}
          </button>
        </div>
      </form>
      <p class="hint">* 소개(바이오) 입력란은 제거했어요.</p>
    </section>
  </div>
</template>

<script setup>
import {
  reactive,
  ref,
  onMounted,
  onBeforeUnmount,
  computed,
  watchEffect,
} from "vue";
import api from "@/utils/api";
import ListPanel from "@/components/ListPanel.vue";

/* ---------------- state ---------------- */
const tab = ref("posts");

const me = reactive({
  studentId: "",
  name: "",
  counts: { posts: 0, comments: 0, favorites: 0 },
});

const form = reactive({ name: "", newPassword: "" });
const saving = ref(false);

const posts = reactive({ items: [], page: 0, hasMore: true });
const comments = reactive({ items: [], page: 0, hasMore: true });
const favs = reactive({ items: [], page: 0, hasMore: true });

const loading = reactive({
  me: true,
  posts: false,
  comments: false,
  favs: false,
});

/* ------------- token change handling ------------- */
const getToken = () => localStorage.getItem("token") || "";
let tokenMemo = getToken();

function resetAll() {
  me.studentId = "";
  me.name = "";
  me.counts = { posts: 0, comments: 0, favorites: 0 };
  posts.items = [];
  posts.page = 0;
  posts.hasMore = true;
  comments.items = [];
  comments.page = 0;
  comments.hasMore = true;
  favs.items = [];
  favs.page = 0;
  favs.hasMore = true;
}

function reloadForNewUser() {
  resetAll();
  fetchMe();
  if (tab.value === "posts") loadPosts();
  if (tab.value === "comments") loadComments();
  if (tab.value === "favorites") loadFavs();
}

// 다른 탭/창에서 토큰 변경 감지
function onStorage(e) {
  if (e.key === "token") {
    const now = getToken();
    if (now !== tokenMemo) {
      tokenMemo = now;
      reloadForNewUser();
    }
  }
}

onMounted(async () => {
  // 첫 진입: 사용자 정보/첫 탭 데이터
  await fetchMe();
  await loadPosts();

  // storage 이벤트 리스너
  window.addEventListener("storage", onStorage);
});

// 같은 탭에서 로그인 전환(동일 창) 대응: 토큰 값 변화 감지
watchEffect(() => {
  const now = getToken();
  if (now !== tokenMemo) {
    tokenMemo = now;
    reloadForNewUser();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("storage", onStorage);
});

/* ---------------- actions ---------------- */
function switchTab(next) {
  tab.value = next;
  // 첫 클릭 시 자동 로드
  if (next === "posts" && posts.items.length === 0) loadPosts();
  if (next === "comments" && comments.items.length === 0) loadComments();
  if (next === "favorites" && favs.items.length === 0) loadFavs();
}

async function fetchMe() {
  loading.me = true;
  try {
    const { data } = await api.get("/api/me");
    me.studentId = data.user?.studentId || "";
    me.name = data.user?.name || "";
    me.counts = data.user?.counts || { posts: 0, comments: 0, favorites: 0 };
    form.name = me.name;
  } catch (e) {
    console.error(e);
    alert("내 정보 불러오기 실패");
  } finally {
    loading.me = false;
  }
}

async function saveProfile() {
  saving.value = true;
  try {
    const payload = { name: form.name };
    if (form.newPassword) payload.newPassword = form.newPassword;
    await api.put("/api/me", payload);
    await fetchMe();
    form.newPassword = "";
    alert("저장 완료!");
  } catch (e) {
    console.error(e);
    alert("저장 실패");
  } finally {
    saving.value = false;
  }
}

async function loadPosts() {
  if (loading.posts || !posts.hasMore) return;
  loading.posts = true;
  try {
    const { data } = await api.get("/api/me/posts", {
      params: { page: posts.page, pageSize: 10 },
    });
    posts.items.push(...data.items);
    posts.page++;
    posts.hasMore = data.hasMore;
  } catch (e) {
    console.error(e);
  } finally {
    loading.posts = false;
  }
}

async function loadComments() {
  if (loading.comments || !comments.hasMore) return;
  loading.comments = true;
  try {
    const { data } = await api.get("/api/me/comments", {
      params: { page: comments.page, pageSize: 10 },
    });
    comments.items.push(...data.items);
    comments.page++;
    comments.hasMore = data.hasMore;
  } catch (e) {
    console.error(e);
  } finally {
    loading.comments = false;
  }
}

async function loadFavs() {
  if (loading.favs || !favs.hasMore) return;
  loading.favs = true;
  try {
    const { data } = await api.get("/api/me/favorites", {
      params: { page: favs.page, pageSize: 10 },
    });
    favs.items.push(...data.items);
    favs.page++;
    favs.hasMore = data.hasMore;
  } catch (e) {
    console.error(e);
  } finally {
    loading.favs = false;
  }
}

/* ------------- avatar ------------- */
const avatarInitial = computed(() => me.name?.[0] || "U");
const avatarStyle = computed(() => {
  const seed = (me.name || "user").charCodeAt(0) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${seed} 80% 70%), hsl(${
      (seed + 40) % 360
    } 80% 60%))`,
  };
});
</script>

<style scoped>
.mypage-wrap {
  max-width: 960px;
  margin: 24px auto;
  padding: 0 16px;
}

/* 헤더카드 */
.profile-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #eee;
  border-radius: 16px;
  padding: 16px 18px;
  background: linear-gradient(180deg, #ffffff, #faf7ff);
  box-shadow: 0 6px 16px rgba(110, 75, 255, 0.06);
}

.pf-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 800;
  font-size: 22px;
  letter-spacing: 0.02em;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.who .name {
  font-size: 18px;
  font-weight: 700;
  color: #222;
}

.who .sid {
  font-size: 13px;
  color: #777;
  margin-top: 2px;
}

.counts {
  display: flex;
  gap: 22px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.counts li {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.counts .num {
  font-weight: 800;
  font-size: 20px;
  color: #2c2c2c;
  line-height: 1;
}

.counts .lbl {
  font-size: 12px;
  color: #8a8a8a;
}

/* 세그먼트 탭 */
.segmented {
  display: flex;
  gap: 8px;
  margin: 18px 0 16px;
  background: #f5f3ff;
  border: 1px solid #e8e3ff;
  border-radius: 12px;
  padding: 6px;
}

.segmented button {
  flex: 0 0 auto;
  padding: 8px 14px;
  border-radius: 9px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 600;
  color: #6b5bd2;
}

.segmented button.active {
  background: #fff;
  box-shadow: 0 4px 12px rgba(108, 90, 210, 0.18);
  color: #3f33b3;
}

/* 설정 폼 */
.settings {
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 16px;
}

.settings h2 {
  margin: 0 0 12px;
}

.form {
  display: grid;
  gap: 12px;
  max-width: 460px;
}

.form label {
  display: grid;
  gap: 6px;
}

.form input {
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
}

.actions {
  margin-top: 6px;
}

.actions button {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #ded7ff;
  background: #6f5bff;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hint {
  color: #888;
  font-size: 12px;
  margin-top: 10px;
}
</style>
