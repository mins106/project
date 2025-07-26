<template>
  <div class="meals-page">
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
        <router-link to="/">홈</router-link> ·
        <router-link to="/login">로그인</router-link> ·
        <router-link to="/signup">회원가입</router-link>
      </div>
    </div>

    <!-- 보라색 네비게이션 메뉴 -->
    <nav class="main-nav">
      <router-link to="/meals">급식</router-link>
      <router-link to="/timetable">시간표</router-link>
      <router-link to="/calendar">학사일정</router-link>
      <router-link to="/board">자유게시판</router-link>
    </nav>

    <!-- 주차 이동 버튼 -->
    <div class="week-nav">
      <button @click="changeWeek(-1)">← 저번주</button>
      <span>{{ formatWeekRange(startDate) }}</span>
      <button @click="changeWeek(1)">다음주 →</button>
    </div>

    <!-- 급식 카드 리스트 -->
    <main class="meal-list">
      <div v-if="filteredMeals.length === 0">
        이번 주에는 급식 데이터가 없습니다.
      </div>
      <div v-else>
        <div v-for="meal in filteredMeals" :key="meal.date" class="meal-card">
          <div class="meal-date">{{ formatDateForDisplay(meal.date) }}</div>
          <div class="meal-content" v-if="meal.menu && meal.menu.trim() !== ''">
            <p class="kcal">{{ meal.cal }} Kcal</p>
            <p v-for="line in meal.menu.split('\n')" :key="line">{{ line }}</p>
          </div>
          <div class="no-meal" v-else>이 날은 급식이 없어요^^</div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: "MealsPage",
  data() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0(일) ~ 6(토)
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7)); // 가장 가까운 월요일

    return {
      meals: [],
      startDate: monday, // 월요일로 고정
    };
  },
  created() {
    this.fetchMeals();
  },
  computed: {
    filteredMeals() {
      return this.meals.filter(
        (meal) => meal?.date && !this.isWeekend(meal.date)
      );
    },
  },
  methods: {
    async fetchMeals() {
      const from = this.formatDateForAPI(this.startDate);
      const to = this.formatDateForAPI(
        new Date(this.startDate.getTime() + 6 * 86400000)
      );
      const res = await fetch(`/api/meals/week?from=${from}&to=${to}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        this.meals = data;
      } else {
        console.error("급식 데이터 형식 오류:", data);
        this.meals = [];
      }
    },
    formatDateForAPI(date) {
      return date.toISOString().split("T")[0].replace(/-/g, "");
    },
    formatDateForDisplay(dateStr) {
      const m = dateStr.slice(4, 6);
      const d = dateStr.slice(6, 8);
      return `${Number(m)}월 ${Number(d)}일`;
    },
    formatWeekRange(startDate) {
      const dayOfWeek = startDate.getDay();
      const monday = new Date(startDate);
      monday.setDate(monday.getDate() - ((dayOfWeek + 6) % 7));

      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);

      return `${monday.getMonth() + 1}월 ${monday.getDate()}일 ~ ${
        friday.getMonth() + 1
      }월 ${friday.getDate()}일`;
    },
    changeWeek(offset) {
      // 현재 startDate 기준으로 월요일을 먼저 계산
      const dayOfWeek = this.startDate.getDay(); // 0: 일 ~ 6: 토
      const monday = new Date(this.startDate);
      monday.setDate(monday.getDate() - ((dayOfWeek + 6) % 7)); // 월요일로 보정

      // offset 주 이동 후 새로운 월요일 계산
      this.startDate = new Date(monday.getTime() + offset * 7 * 86400000);
      this.fetchMeals();
    },
    isWeekend(dateStr) {
      const date = new Date(
        `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
      );
      const day = date.getDay();
      return day === 0 || day === 6;
    },
  },
};
</script>

<style scoped>
.meals-page {
  font-family: "Noto Sans KR", sans-serif;
  background: #f8f9fc;
  min-height: 100vh;
}

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

.main-nav a:hover {
  text-decoration: underline;
}

.main-nav a.router-link-exact-active {
  text-decoration: underline;
}

.week-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
}

.week-nav button {
  background-color: #4b2aad;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.week-nav span {
  font-weight: bold;
}

.meal-list {
  padding: 20px;
  max-width: 600px;
  margin: auto;
}

.meal-card {
  background-color: #e6f0ff;
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.meal-date {
  background-color: #4b2aad;
  color: white;
  padding: 10px;
  font-weight: bold;
  text-align: center;
}

.meal-content {
  padding: 12px 16px;
  font-size: 15px;
}

.kcal {
  font-weight: bold;
  margin-bottom: 8px;
}

.no-meal {
  padding: 16px;
  text-align: center;
  font-size: 14px;
  color: #555;
}
</style>
