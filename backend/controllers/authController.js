const db = require('../db/datebase');

// 회원가입 처리
exports.signUp = async (req, res) => {
  const { studentId, name, userId, password } = req.body;

  if (!studentId || !name || !userId || !password) {
    return res.status(400).json({ message: '모든 항목을 입력해주세요.' });
  }

  // 아이디 중복 확인
  db.get("SELECT * FROM users WHERE user_id = ?", [userId], (err, row) => {
    if (row) {
      return res.status(409).json({ message: '이미 사용 중인 아이디입니다.' });
    }

    // 회원 등록
    db.run(
      "INSERT INTO users (student_id, name, user_id, password) VALUES (?, ?, ?, ?)",
      [studentId, name, userId, password],
      function (err) {
        if (err) {
          return res.status(500).json({ message: 'DB 오류' });
        }
        res.status(201).json({ message: '회원가입 성공!' });
      }
    );
  });
};

// 로그인 처리
exports.login = async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요.' });
  }

  db.get(
    "SELECT * FROM users WHERE user_id = ? AND password = ?",
    [userId, password],
    (err, user) => {
      if (user) {
        res.json({
          message: '로그인 성공',
          user: { name: user.name, userId: user.user_id }
        });
      } else {
        res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      }
    }
  );
};

// 아이디 중복 확인
exports.checkUserId = (req, res) => {
  const { userId } = req.query;

  db.get("SELECT * FROM users WHERE user_id = ?", [userId], (err, row) => {
    if (row) {
      return res.status(409).json({ message: '이미 사용 중입니다.' });
    } else {
      return res.json({ message: '사용 가능한 아이디입니다.' });
    }
  });
};