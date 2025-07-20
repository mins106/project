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
                <router-link to="/main">홈</router-link> · <router-link to="/login">로그인</router-link> · <router-link
                    to="/member">회원가입</router-link>
            </div>
        </div>

        <!-- 보라색 네비게이션 메뉴 -->
        <nav class="main-nav">
            <router-link to="/meals">급식</router-link>
            <router-link to="/timetable">시간표</router-link>
            <router-link to="/calendar">학사일정</router-link>
            <router-link to="/board">자유게시판</router-link>
        </nav>

        <!-- 날짜 네비게이션 -->
        <div class="date-nav">
            <button @click="changeDate(-1)">←</button>
            <span>{{ formatDate(currentDate) }}</span>
            <button @click="changeDate(1)">→</button>
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
    </div>
</template>

<script>
export default {
    name: "TimeTablePage",
    data() {
        return {
            grade: 3,        // 학년 고정 또는 로그인 정보 기반
            classNum: 2,     // 반 고정 또는 로그인 정보 기반
            currentDate: new Date(),
            timetable: []
        };
    },
    created() {
        this.fetchTimetable();
    },
    methods: {
        async fetchTimetable() {
            const ymd = this.formatYMD(this.currentDate);
            try {
                const res = await fetch(`/api/timetable?grade=${this.grade}&classNum=${this.classNum}&date=${ymd}`);
                const data = await res.json();
                this.timetable = (data.timetable || []).concat(Array(7).fill("")).slice(0, 7);
            } catch (err) {
                console.error("시간표 불러오기 실패:", err);
                this.timetable = [];
            }
        },
        changeDate(offset) {
            const newDate = new Date(this.currentDate);
            newDate.setDate(this.currentDate.getDate() + offset);
            this.currentDate = newDate;
            this.fetchTimetable();
        },
        formatDate(date) {
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${m}.${d}`;
        },
        formatYMD(date) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}${m}${d}`; // ex: 20250720
        }
    }
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

.date-nav {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    font-size: 1.2rem;
    margin: 2rem 0 1rem;
}

.timetable-table {
    width: 80%;
    max-width: 500px;
    margin: 0 auto;
    border-collapse: collapse;
}

.timetable-table td {
    border: 1px solid #ddd;
    padding: 12px;
    font-size: 1rem;
    background-color: #f9f9f9;
}

.no-timetable {
    text-align: center;
    font-size: 1rem;
    color: #888;
    margin-top: 2rem;
}
</style>