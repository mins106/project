<template>
  <div class="main-page">
    <!-- 상단 로고 + 로그인/회원가입 -->
    <div class="top-bar">
      <div class="logo-wrap">
        <img src="@/assets/logo.png" alt="로고" />
        <div class="logo-text">
          <div class="school-name-ko">동백중학교</div>
          <div class="school-name-en">Dongbaek Middle School</div>
        </div>
      </div>
      <div class="right-links">
        <router-link to="/main">홈</router-link> · <router-link to="/login">로그인</router-link> · <router-link to="/member">회원가입</router-link>
      </div>
    </div>

    <!-- 보라색 네비게이션 메뉴 -->
    <nav class="main-nav">
      <router-link to="/meals">급식</router-link>
      <router-link to="/timetable">시간표</router-link>
      <router-link to="/calendar">학사일정</router-link>
      <router-link to="/board">자유게시판</router-link>
    </nav>

    <!-- 히어로 이미지 -->
    <section class="hero">
      <div class="overlay">
        <h2>
          <span class="highlight">따뜻한 인성</span>이 넘치는
          <span class="highlight2">미래 인재</span> 육성
        </h2>
        <p>우리 학교 홈페이지에 오신 것을 환영합니다.</p>
      </div>
    </section>

    <!-- BEST + MORE -->
    <section class="best-posts">
      <div class="best-header">
        <h3>BEST</h3>
        <router-link to="/board" class="more-link">MORE ➜</router-link>
      </div>
      <div class="card-list">
        <div class="card">
          <h4>과학 토론 동아리 모집</h4>
          <p>지원자: 3학년 1반으로</p>
          <p>모집 기간: 3/5 ~ 3/12</p>
          <div class="reactions">👍 15 💬 5 👎 0</div>
        </div>
        <div class="card">
          <h4>작은 음악회 공고</h4>
          <p>일시 : 7/11<br />오디션 : 7/7<br />→ 음악실로!!</p>
          <div class="reactions">👍 13 💬 6 👎 0</div>
        </div>
        <div class="card">
          <h4>기대되는 방학</h4>
          <p>방학식 : 7/18<br />개학 : 8/16</p>
          <div class="reactions">👍 10 💬 2 👎 1</div>
        </div>
      </div>
    </section>

    <!-- 규칙 -->
    <section class="rules">
      <h3>규칙</h3>
      <ul>
        <li>- 비난, 욕설 금지</li>
        <li>- 거짓 정보 공지 금지</li>
        <li>- 안전질서 신고</li>
      </ul>
    </section>
  </div>
</template>

<script>
export default {
  name: "MainPage",
};
</script>

<style scoped>
.main-page {
  background-color: #f9f9f9;
  font-family: "Noto Sans KR", sans-serif;
  margin: 0;
}

/* 최상단 바 (로고 + 로그인) */
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

.right-links {
  font-size: 0.9rem;
}

.right-links a {
  margin-left: 0.5rem;
  text-decoration: none;
  color: #444;
}

.right-links a:hover {
  text-decoration: underline;
}

/* 메뉴바 */
.main-nav {
  background-color: #5a2fc9;
  padding: 0.8rem 0;
  text-align: center;
  position: sticky; /* 👈 상단 고정 */
  top: 0; /* 화면 맨 위에 붙이기 */
  z-index: 1000; /* 다른 요소 위에 보이도록 */
}

.main-nav a {
  color: white;
  text-decoration: none;
  margin: 0 1.5rem;
  font-weight: 500;
}

.main-nav a:hover {
  text-decoration: underline;
}

/* 히어로 */
.hero {
  position: relative;
  height: 350px;
  background-image: url("@/assets/sample-hero.png");
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero .overlay {
  background-color: rgba(0, 0, 0, 0.45);
  padding: 2rem 3rem;
  border-radius: 20px;
  text-align: center;
  color: white;
}

.hero h2 .highlight {
  color: #d94b70;
}

.hero h2 .highlight2 {
  color: #3791ec;
}

/* BEST 카드 */
.best-posts {
  padding: 2rem 3rem;
}

.best-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.best-header h3 {
  font-size: 1.4rem;
}

.more-link {
  color: #5a2fc9;
  text-decoration: none;
  font-weight: bold;
}

.more-link:hover {
  text-decoration: underline;
}

.card-list {
  display: flex;
  flex-wrap: nowrap; /* 줄바꿈 없이 가로로 */
  gap: 1.2rem;
  padding-top: 1rem;
  overflow-x: auto; /* 가로 스크롤 가능 */
  padding-bottom: 1rem;
}
.card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  min-width: 250px; /* 고정 너비 */
  flex-shrink: 0; /* 축소되지 않게 */
}

.card h4 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.card .reactions {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #555;
}

/* 규칙 */
.rules {
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 12px;
  padding: 1.5rem 2rem;
  margin: 2rem 3rem;
}

.rules h3 {
  margin-bottom: 0.8rem;
}

.rules ul {
  padding-left: 1rem;
}

.rules li {
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.more-link {
  color: #5a2fc9;
  text-decoration: none;
  font-weight: bold;
}
.more-link:hover {
  text-decoration: underline;
}
</style>
