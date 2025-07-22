<template>
  <div class="timetable-page">
    <div class="top-bar">
      <div class="logo-wrap">
        <img src="@/assets/logo.png" alt="로고" />
        <div class="logo-text">
          <div class="school-name-ko">동백중학교</div>
          <div class="school-name-en">Dongbaek Middle School</div>
        </div>
      </div>
      <div class="right-links">
        <router-link to="/main">홈</router-link> ·
        <router-link to="/login">로그인</router-link> ·
        <router-link to="/member">회원가입</router-link>
      </div>
    </div>

    <nav class="main-nav">
      <router-link to="/meals">급식</router-link>
      <router-link to="/timetable">시간표</router-link>
      <router-link to="/calendar">학사일정</router-link>
      <router-link to="/board">자유게시판</router-link>
    </nav>

    <div class="selector-wrap">
      <div class="select-box">
        <label>학년</label>
        <select v-model="grade" @change="fetchWeekTimetable">
          <option v-for="g in [1, 2, 3]" :key="g" :value="g">{{ g }}학년</option>
        </select>
      </div>
      <div class="select-box">
        <label>반</label>
        <select v-model="classNum" @change="fetchWeekTimetable">
          <option v-for="n in getClassCount(grade)" :key="n" :value="n">{{ n }}반</option>
        </select>
      </div>
    </div>

    <table class="weekly-timetable">
      <thead>
        <tr>
          <th>교시</th>
          <th v-for="(day, idx) in weekdays" :key="idx">
            {{ formatDate(weekStartDate, idx) }}<br />({{ day }})
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="period in 7" :key="period">
          <td class="period">{{ period }}</td>
          <td v-for="dayIndex in 5" :key="dayIndex">
            {{ timetable[dayIndex - 1][period - 1] || '' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: "TimeTablePage",
  data() {
    return {
      grade: 1,
      classNum: 1,
      weekStartDate: this.getMonday(new Date()),
      timetable: [[], [], [], [], []],
      weekdays: ['월', '화', '수', '목', '금']
    };
  },
  methods: {
    getClassCount(grade) {
      if (grade === 3) return 11;
      if (grade === 1 || grade === 2) return 13;
      return 0;
    },
    getMonday(d) {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(date.setDate(diff));
    },
    formatDate(start, offset) {
      const d = new Date(start);
      d.setDate(d.getDate() + offset);
      return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`;
    },
    async fetchWeekTimetable() {
      if (!this.grade || !this.classNum) return;
      const promises = [];
      for (let i = 0; i < 5; i++) {
        const date = new Date(this.weekStartDate);
        date.setDate(date.getDate() + i);
        const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
        promises.push(
          fetch(`/api/timetable?grade=${this.grade}&classNum=${this.classNum}&date=${ymd}`)
            .then(res => res.json())
            .then(data => data.timetable || [])
        );
      }
      this.timetable = await Promise.all(promises);
    }
  },
  mounted() {
    this.fetchWeekTimetable();
  }
};
</script>

<style scoped>
.timetable-page {
  font-family: "Noto Sans KR", sans-serif;
  background: #f8f9fc;
  min-height: 100vh;
  padding-bottom: 2rem;
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

.selector-wrap {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 1.5rem 0;
}

.select-box {
  display: flex;
  flex-direction: column;
  font-size: 0.95rem;
  font-weight: 500;
}

.select-box select {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1.5px solid #ccc;
  background: #fff;
  font-size: 1rem;
  margin-top: 0.5rem;
  transition: border 0.2s ease;
}

.select-box select:focus {
  border-color: #5a2fc9;
  outline: none;
}

.weekly-timetable {
  width: 95%;
  margin: 0 auto;
  border-collapse: collapse;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.weekly-timetable th,
.weekly-timetable td {
  border: 1px solid #ddd;
  padding: 0.6rem;
  text-align: center;
  font-size: 1rem;
}

.weekly-timetable th {
  background: #f3f3f3;
  font-weight: bold;
  color: #444;
}

.period {
  background-color: #f8f8f8;
  font-weight: 600;
  color: #666;
}
</style>