<template>
  <div class="calendar-page">
    <!-- 연/월 선택 -->
    <div class="calendar-nav">
      <div class="select-group">
        <select v-model="selectedYear" @change="onYearChange">
          <option
            v-for="year in Object.keys(allowedMonths)"
            :key="year"
            :value="Number(year)"
          >
            {{ year }}
          </option>
        </select>
        <span>년</span>
        <select v-model="selectedMonth" @change="updateCalendar">
          <option v-for="idx in filteredMonths" :key="idx" :value="idx">
            {{ months[idx] }}
          </option>
        </select>
        <span>월</span>
      </div>
    </div>

    <!-- 달력 -->
    <table class="calendar-table">
      <thead>
        <tr>
          <th
            v-for="(day, idx) in days"
            :key="day"
            :class="{ sun: idx === 6, sat: idx === 5 }"
          >
            {{ day }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(week, i) in calendar" :key="i">
          <td
            v-for="(cell, j) in week"
            :key="j"
            :class="{ sun: j === 6, sat: j === 5, today: isToday(cell) }"
          >
            <div v-if="cell !== null" class="day-card">
              <div class="day-number">{{ cell }}</div>
              <div
                v-for="event in getEvents(cell)"
                :key="event"
                class="event-text"
              >
                {{ event }}
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import schedule from "@/assets/academic_schedule_full.json";

export default {
  name: "CalendarPage",
  data() {
    const now = new Date();
    const allowed = {
      2025: Array.from({ length: 10 }, (_, i) => i + 2), // 3~12월
      2026: [0, 1], // 1~2월
    };

    let selectedYear = now.getFullYear();
    let selectedMonth = now.getMonth();

    // 현재 날짜가 표시 가능한 범위에 없으면 default로 설정
    if (!allowed[selectedYear]) {
      selectedYear = 2025;
      selectedMonth = 2;
    } else if (!allowed[selectedYear].includes(selectedMonth)) {
      selectedMonth = allowed[selectedYear][0];
    }

    return {
      selectedYear,
      selectedMonth,
      months: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
      days: ["월", "화", "수", "목", "금", "토", "일"],
      calendar: [],
      eventsMap: {},
      allowedMonths: allowed,
      today: now,
    };
  },
  computed: {
    filteredMonths() {
      return this.allowedMonths[this.selectedYear] || [];
    },
  },
  mounted() {
    this.makeEventMap();
    this.updateCalendar();
  },
  methods: {
    onYearChange() {
      this.selectedMonth = this.filteredMonths[0];
      this.updateCalendar();
    },
    makeEventMap() {
      this.eventsMap = schedule.reduce((map, item) => {
        const splitEvents = item.event.split("\n");
        map[item.date] = (map[item.date] || []).concat(splitEvents);
        return map;
      }, {});
    },
    updateCalendar() {
      const firstDate = new Date(this.selectedYear, this.selectedMonth, 1);
      const lastDate = new Date(this.selectedYear, this.selectedMonth + 1, 0);
      const firstDay = (firstDate.getDay() + 6) % 7;

      const daysInMonth = lastDate.getDate();
      const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

      const cells = Array(totalCells).fill(null);
      for (let i = 0; i < daysInMonth; i++) {
        cells[firstDay + i] = i + 1;
      }

      const weeks = [];
      for (let i = 0; i < cells.length; i += 7) {
        weeks.push(cells.slice(i, i + 7));
      }
      this.calendar = weeks;
    },
    getEvents(day) {
      if (!day) return [];
      const yyyy = this.selectedYear;
      const mm = String(this.selectedMonth + 1).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      return this.eventsMap[dateStr] || [];
    },
    isToday(day) {
      if (!day) return false;
      const y = this.today.getFullYear();
      const m = this.today.getMonth();
      const d = this.today.getDate();
      return this.selectedYear === y && this.selectedMonth === m && day === d;
    },
  },
};
</script>

<style scoped>
.calendar-page {
  font-family: "Noto Sans KR", sans-serif;
  background: #f8f9fc;
  min-height: 100vh;
  padding-bottom: 3rem;
}

/* 연/월 드롭다운 */
.calendar-nav {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
}

.select-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.select-group select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-color: white;
  border: 1px solid #ccc;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: border 0.2s ease;
}

.select-group select:focus {
  outline: none;
  border-color: #5a2fc9;
}

.select-group span {
  font-size: 1rem;
  font-weight: 500;
}

/* 달력 테이블 */
.calendar-table {
  width: 90%;
  margin: auto;
  border-collapse: collapse;
  table-layout: fixed;
}

.calendar-table th {
  background: #eef;
  font-weight: 600;
  padding: 0.5rem;
}

.calendar-table td {
  padding: 0.5rem;
  vertical-align: top;
  height: 120px;
  border: 1px solid #ddd;
  overflow-wrap: break-word;
}

.sat {
  color: #1a73e8;
}

.sun {
  color: #e53935;
}

.today .day-card {
  background-color: #edeaff !important;
  border: 2px solid #5a2fc9;
}

/* 날짜 카드 */
.day-card {
  background: white;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  padding: 0.4rem;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.day-number {
  font-weight: bold;
  font-size: 1rem;
  margin-bottom: 0.2rem;
}

.event-text {
  font-size: 0.7rem;
  background: #e0e7ff;
  color: #333;
  padding: 2px 6px;
  border-radius: 6px;
  margin-top: 4px;
  display: inline-block;
}
</style>
