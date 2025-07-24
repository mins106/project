const express = require('express');
const app = express();
const mealsRouter = require('./routes/meals');
const timetableRouter = require('./routes/timetable');
const authRouter = require('./routes/auth'); // ✅ 추가
const cors = require('cors');

app.use(cors());
app.use(express.json()); // ✅ POST 요청 받기 위해 필요
app.use(express.urlencoded({ extended: true }));

// API 라우터 연결
app.use('/api/meals', mealsRouter);
app.use('/api/timetable', timetableRouter);
app.use('/api', authRouter); // ✅ /api/signup, /api/login 등 처리

// 서버 실행
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
