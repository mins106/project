const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');

// DB 연결 (경로 수정!)
const db = require('./db/database.js');

// 미들웨어 설정
app.use(cors({
  origin: "http://localhost:8080",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // 🔴 라우터보다 먼저
app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',   // 프록시 쓰면 이 값이면 충분
    secure: false,     // 로컬 http
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));

// 라우터 가져오기
const mealsRouter = require('./routes/meals');
const timetableRouter = require('./routes/timetable');
const authRouter = require('./routes/auth');
const postsRouter = require('./routes/posts'); // ✅ 게시글 라우터 추가
const favoritesRoutes = require('./routes/favorites');
const meRoutes = require('./routes/me')

// 라우터 연결
app.use('/api/meals', mealsRouter);
app.use('/api/timetable', timetableRouter);
app.use('/api', authRouter);
app.use('/api/posts', postsRouter); // ✅ 게시글 라우터 경로 추가
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', favoritesRoutes);
app.use('/api/me', meRoutes)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// 서버 실행
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});