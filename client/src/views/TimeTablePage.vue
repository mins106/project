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

    <!-- 보라색 네비게이션 메뉴 -->
    <nav class="main-nav">
      <router-link to="/meals">급식</router-link>
      <router-link to="/timetable">시간표</router-link>
      <router-link to="/calendar">학사일정</router-link>
      <router-link to="/board">자유게시판</router-link>
    </nav>

    <!-- 학년 / 반 선택 UI -->
    <div class="dropdowns">
      <div class="dropdown-box">
        <label>학년</label>
        <select v-model="grade" @change="onGradeClassChange">
          <option disabled value="">학년 선택</option>
          <option v-for="g in grades" :key="g" :value="g">{{ g }}학년</option>
        </select>
      </div>

      <div class="dropdown-box">
        <label>반</label>
        <select
          v-model="classNum"
          @change="onGradeClassChange"
          :disabled="!grade"
        >
          <option disabled value="">반 선택</option>
          <option v-for="c in classOptions" :key="c" :value="c">
            {{ c }}반
          </option>
        </select>
      </div>
    </div>

    <!-- 날짜 네비게이션 -->
    <div class="date-nav">
      <button class="arrow-btn" @click="changeDate(-1)">←</button>
      <span class="date-text">{{ formatDate(currentDate) }}</span>
      <button class="arrow-btn" @click="changeDate(1)">→</button>
    </div>

    <!-- 시간표 테이블 -->
    <table class="timetable-table">
      <tbody>
        <tr v-for="(subject, index) in timetable" :key="index">
          <td>{{ index + 1 }}</td>
          <td>{{ subject || "" }}</td>
        </tr>
      </tbody>
    </table>

    <!-- 조건 메시지 -->
    <div v-if="noTimetableMessage" class="timetable-message">
      {{ noTimetableMessage }}
    </div>
  </div>
</template>

<script>
export default {
  name: "TimeTablePage",
  data() {
    return {
      grade: "",
      classNum: "",
      grades: [1, 2, 3],
      classesByGrade: {
        1: Array.from({ length: 13 }, (_, i) => i + 1),
        2: Array.from({ length: 13 }, (_, i) => i + 1),
        3: Array.from({ length: 11 }, (_, i) => i + 1),
      },
      currentDate: new Date(),
      timetable: [],
      noTimetableMessage: "",
    };
  },
  computed: {
    classOptions() {
      return this.classesByGrade[this.grade] || [];
    },
  },
  created() {
    this.fetchTimetable();
  },
  methods: {
    async fetchTimetable() {
      if (!this.grade || !this.classNum) return;

      const ymd = this.formatYMD(this.currentDate);
      const day = this.currentDate.getDay(); // 0:일 ~ 6:토

      if (day === 0 || day === 6) {
        this.timetable = Array(7).fill("");
        this.noTimetableMessage = "오늘은 주말이라 수업이 없어요";
        return;
      }

      try {
        const res = await fetch(
          `/api/timetable?grade=${this.grade}&classNum=${this.classNum}&date=${ymd}`
        );
        const data = await res.json();

        const subjects = data.timetable || [];

        if (subjects.length === 0 || subjects.every((s) => !s)) {
          this.noTimetableMessage = "오늘은 수업이 없어요";
        } else {
          this.noTimetableMessage = "";
        }

        this.timetable = subjects.concat(Array(7).fill("")).slice(0, 7);
      } catch (err) {
        console.error("시간표 불러오기 실패:", err);
        this.timetable = Array(7).fill("");
        this.noTimetableMessage = "시간표 정보를 불러오지 못했어요";
      }
    },
    onGradeClassChange() {
      if (!this.classOptions.includes(Number(this.classNum))) {
        this.classNum = ""; // 학년 바뀌면 기존 반 초기화
      }
      this.fetchTimetable();
    },
    changeDate(offset) {
      const newDate = new Date(this.currentDate);
      newDate.setDate(this.currentDate.getDate() + offset);
      this.currentDate = newDate;
      this.fetchTimetable();
    },
    formatDate(date) {
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${m}.${d}`;
    },
    formatYMD(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}${m}${d}`;
    },
  },
};
</script>

<style scoped>
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

.dropdowns {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 1.5rem 0 1rem;
}

.dropdown-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-weight: 500;
  font-size: 0.95rem;
}

.dropdown-box label {
  margin-bottom: 0.3rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

.dropdown-box select {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1.5px solid #ccc;
  font-size: 1rem;
  background-color: #f9f9f9;
  transition: border 0.2s ease;
}

.dropdown-box select:focus {
  border-color: #5a2fc9;
  outline: none;
}

.date-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.2rem;
  margin: 1.5rem 0;
  font-size: 1.1rem;
}

.arrow-btn {
  border: none;
  background-color: #5a2fc9;
  color: white;
  padding: 0.4rem 0.9rem;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s ease;
}

.arrow-btn:hover {
  background-color: #4321a0;
}

.timetable-table {
  width: 90%;
  max-width: 500px;
  margin: 0 auto;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.timetable-table td {
  border-bottom: 1px solid #eee;
  padding: 14px 18px;
  font-size: 1rem;
  text-align: center;
}

.timetable-table tr:last-child td {
  border-bottom: none;
}

.timetable-table td:nth-child(1) {
  font-weight: bold;
  color: #555;
  background-color: #f7f7f7;
}

.no-timetable {
  text-align: center;
  font-size: 1rem;
  color: #888;
  margin-top: 2rem;
}

.timetable-message {
  text-align: center;
  margin-top: 1rem;
  color: #666;
  font-size: 1rem;
}
</style>
