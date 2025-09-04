<template>
  <div class="meals-page">
    <!-- 주차 이동 -->
    <div class="week-nav">
      <button @click="changeWeek(-1)">← 저번주</button>
      <span>{{ formatWeekRange(startDate) }}</span>
      <button @click="changeWeek(1)">다음주 →</button>
    </div>

    <main class="meal-list">
      <div v-if="filteredMeals.length === 0">
        이번 주에는 급식 데이터가 없습니다.
      </div>

      <div v-else>
        <div v-for="meal in filteredMeals" :key="meal.date" class="meal-card">
          <div class="meal-date">{{ formatDateForDisplay(meal.date) }}</div>

          <div class="meal-content" v-if="meal.menu && meal.menu.trim() !== ''">
            <p class="kcal">{{ meal.cal }}</p>
            <p v-for="line in meal.menu.split('\n')" :key="line">{{ line }}</p>
          </div>
          <div class="no-meal" v-else>이 날은 급식이 없어요^^</div>

          <!-- 상세 페이지로 이동 -->
          <router-link
            class="detail-btn"
            :to="{ name: 'MealDetail', params: { date: meal.date } }"
          >
            메뉴 상세 보기 →
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: "MealsPage",
  props: { initialDate: { type: String, default: null } },

  data() {
    // 기본: 이번 주 월요일
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    return { meals: [], startDate: monday };
  },

  created() {
    // URL로 날짜가 들어오면 그 주 월요일로 보정
    if (this.initialDate) {
      const d = this.initialDate.replace(/-/g, "");
      const date = new Date(
        `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
      );
      const dow = date.getDay();
      const monday = new Date(date);
      monday.setDate(date.getDate() - ((dow + 6) % 7));
      this.startDate = monday;
    }
    this.fetchMeals();
  },

  computed: {
    filteredMeals() {
      return this.meals.filter((m) => m?.date && !this.isWeekend(m.date));
    },
  },

  methods: {
    async fetchMeals() {
      const from = this.formatDateForAPI(this.startDate);
      const to = this.formatDateForAPI(
        new Date(this.startDate.getTime() + 6 * 86400000)
      );
      try {
        const res = await fetch(`/api/meals/week?from=${from}&to=${to}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.meals = Array.isArray(data) ? data : [];
      } catch (e) {
        console.error("급식 요청 실패:", e);
        this.meals = [];
      }
    },
    formatDateForAPI(date) {
      return date.toISOString().split("T")[0].replace(/-/g, "");
    },
    formatDateForDisplay(dateStr) {
      const m = dateStr.slice(4, 6),
        d = dateStr.slice(6, 8);
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
      const dayOfWeek = this.startDate.getDay();
      const monday = new Date(this.startDate);
      monday.setDate(monday.getDate() - ((dayOfWeek + 6) % 7));
      this.startDate = new Date(monday.getTime() + offset * 7 * 86400000);
      this.fetchMeals();
    },
    isWeekend(dateStr) {
      const d = new Date(
        `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
      );
      const day = d.getDay();
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

.week-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
}

.week-nav button {
  background: #4b2aad;
  color: #fff;
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
  max-width: 720px;
  margin: auto;
}

.meal-card {
  background: #e6f0ff;
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.meal-date {
  background: #4b2aad;
  color: #fff;
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

.detail-btn {
  display: block;
  width: fit-content;
  margin: 10px auto 14px;
  background: #4b2aad;
  color: #fff;
  text-decoration: none;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(75, 42, 173, 0.2);
}

.detail-btn:hover {
  filter: brightness(1.05);
}
</style>
