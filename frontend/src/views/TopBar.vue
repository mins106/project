<template>
  <!-- 상단 로고 + 로그인/회원가입 -->
  <div class="top-bar">
    <div class="logo-wrap">
      <img src="@/assets/logo.png" alt="로고" />
      <div class="logo-text">
        <div class="school-name-ko">OO중학교</div>
        <div class="school-name-en">OOO Middle School</div>
      </div>
    </div>
    <div class="right-links">
      <router-link to="/">홈</router-link> ·
      <template v-if="isLoggedIn">
        <a href="#" @click="logout">로그아웃</a>
      </template>
      <template v-else>
        <router-link to="/login">로그인</router-link> ·
        <router-link to="/signup">회원가입</router-link>
      </template>
    </div>
  </div>

  <!-- 보라색 네비게이션 메뉴 -->
  <nav class="main-nav">
    <router-link to="/meals">급식</router-link>
    <router-link to="/timetable">시간표</router-link>
    <router-link to="/calendar">학사일정</router-link>
    <router-link to="/board">자유게시판</router-link>
  </nav>
</template>

<script>
export default {
  name: "TopBar",
  data() {
    return {
      isLoggedIn: false,
    };
  },
  mounted() {
    this.syncLoginState();
    // 다른 탭/창에서도 상태 변화를 감지
    window.addEventListener("storage", this.syncLoginState);
  },
  beforeUnmount() {
    window.removeEventListener("storage", this.syncLoginState);
  },
  methods: {
    syncLoginState() {
      this.isLoggedIn = !!localStorage.getItem("user");
    },
    logout() {
      localStorage.removeItem("user");
      this.syncLoginState();
      this.$router.push("/");
    },
  },
};
</script>

<style scoped>
/* 상단 바 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
}

.logo-wrap {
  display: flex;
  align-items: center;
}

.logo-wrap img {
  width: 50px;
  height: 50px;
  margin-right: 0.5rem;
}

.logo-text .school-name-ko {
  font-weight: bold;
  font-size: 1.2rem;
}

.logo-text .school-name-en {
  font-size: 0.9rem;
  color: #555;
}

.right-links a {
  margin-left: 0.5rem;
  text-decoration: none;
  color: #444;
}

/* 네비게이션 메뉴 */
.main-nav {
  background-color: #5a2fc9;
  padding: 0.8rem 0;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.main-nav a {
  color: white;
  text-decoration: none;
  margin: 0 1.5rem;
  font-weight: 500;
}

.main-nav a.router-link-exact-active {
  text-decoration: underline;
}
</style>
