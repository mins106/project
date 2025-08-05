const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util'); // ✅ 추가

// DB 연결
const db = new sqlite3.Database(path.join(__dirname, 'mydb.sqlite3'), (err) => {
  if (err) {
    console.error('DB 연결 실패:', err.message);
  } else {
    console.log('✅ SQLite DB 연결 성공');
  }
});

// 테이블 생성
db.serialize(() => {
  // 회원 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      name TEXT NOT NULL,
      user_id TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `);

  // 게시글 테이블
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
      dislikes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      isBest INTEGER DEFAULT 0
    );
  `);

  // 댓글 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      postId INTEGER NOT NULL,
      text TEXT NOT NULL,
      author TEXT DEFAULT '익명',
      studentId TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (postId) REFERENCES posts(id)
    )
  `);
});

// ✅ 비동기 함수로 사용할 수 있게 promisify 적용
db.run = promisify(db.run.bind(db));
db.get = promisify(db.get.bind(db));
db.all = promisify(db.all.bind(db));

module.exports = db;
