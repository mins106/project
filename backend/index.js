const express = require('express');
const app = express();
const cors = require('cors');

// DB 연결 (경로 수정!)
const db = require('./db/database.js');

// 라우터 가져오기
const mealsRouter = require('./routes/meals');
const timetableRouter = require('./routes/timetable');
const authRouter = require('./routes/auth');
const postsRouter = require('./routes/posts'); // ✅ 게시글 라우터 추가

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우터 연결
app.use('/api/meals', mealsRouter);
app.use('/api/timetable', timetableRouter);
app.use('/api', authRouter);
app.use('/api/posts', postsRouter); // ✅ 게시글 라우터 경로 추가

// 서버 실행
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
