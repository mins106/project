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

// ⭐ users 테이블이 없으면 자동으로 생성됨
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
});

module.exports = db;