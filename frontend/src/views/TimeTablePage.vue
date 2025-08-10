<template>
  <div class="timetable-page">
    <div class="selector-wrap">
      <div class="select-box">
        <label>학년</label>
        <select v-model.number="grade" @change="fetchWeekTimetable">
          <option v-for="g in [1, 2, 3]" :key="g" :value="g">
            {{ g }}학년
          </option>
        </select>
      </div>
      <div class="select-box">
        <label>반</label>
        <select v-model.number="classNum" @change="fetchWeekTimetable">
          <option v-for="n in getClassCount(grade)" :key="n" :value="n">
            {{ n }}반
          </option>
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
            {{ timetable[dayIndex - 1][period - 1] || "" }}
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
      weekdays: ["월", "화", "수", "목", "금"],
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
      return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
    },
    async fetchWeekTimetable() {
      if (!this.grade || !this.classNum) return;
      const promises = [];
      for (let i = 0; i < 5; i++) {
        const date = new Date(this.weekStartDate);
        date.setDate(date.getDate() + i);
        const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
        promises.push(
          fetch(
            `/api/timetable?grade=${this.grade}&classNum=${this.classNum}&date=${ymd}`
          )
            .then((res) => res.json())
            .then((data) => data.timetable || [])
        );
      }
      this.timetable = await Promise.all(promises);
    },
  },
  mounted() {
    this.fetchWeekTimetable();
  },
};
</script>

<style scoped>
.timetable-page {
  font-family: "Noto Sans KR", sans-serif;
  background: #f8f9fc;
  min-height: 100vh;
  padding-bottom: 2rem;
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
