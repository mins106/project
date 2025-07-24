const express = require('express');
const app = express();
const mealsRouter = require('./routes/meals'); // 경로는 실제 위치에 따라 다름
const timetableRouter = require('./routes/timetable');

// 이 부분이 핵심!
app.use('/api/meals', mealsRouter);
app.use('/api/timetable', timetableRouter);

// 서버 실행
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});