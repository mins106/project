const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// DB 파일 생성 또는 열기
const db = new sqlite3.Database(path.join(__dirname, 'mydb.sqlite3'), (err) => {
  if (err) {
    console.error('DB 연결 실패:', err.message);
  } else {
    console.log('SQLite DB 연결 성공');
  }
});

// users 테이블 생성
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      name TEXT NOT NULL,
      user_id TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `);

  // ✅ posts 테이블 생성
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tag TEXT NOT NULL,
      author TEXT NOT NULL,
      studentId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      isBest INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  postId INTEGER,
  text TEXT
)
  `);
});

module.exports = db;
