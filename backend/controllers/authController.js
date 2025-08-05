const db = require('../db/database');

// 회원가입
exports.signUp = async (req, res) => {
  const { studentId, name, userId, password } = req.body;

  if (!studentId || !name || !userId || !password) {
    return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
  }

  try {
    const existingUser = await db.get('SELECT * FROM users WHERE user_id = ?', [userId]);
    if (existingUser) {
      return res.status(409).json({ message: '이미 존재하는 아이디입니다.' });
    }

    await db.run(
      'INSERT INTO users (student_id, name, user_id, password) VALUES (?, ?, ?, ?)',
      [studentId, name, userId, password]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error('❌ 회원가입 오류:', err.message);
    res.status(500).json({ message: '서버 오류로 회원가입 실패' });
  }
};

// 로그인
exports.login = async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요.' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE user_id = ?', [userId]);

    if (!user) {
      return res.status(404).json({ message: '존재하지 않는 아이디입니다.' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    res.json({
      user: {
        name: user.name,
        userId: user.student_id,
      },
    });
  } catch (err) {
    console.error('❌ 로그인 오류:', err.message);
    res.status(500).json({ message: '서버 오류로 로그인 실패' });
  }
};

// 아이디 중복 확인
exports.checkUserId = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: '아이디를 입력하세요.' });
  }

  try {
    const existingUser = await db.get('SELECT * FROM users WHERE user_id = ?', [userId]);
    if (existingUser) {
      return res.status(409).json({ message: '이미 존재하는 아이디입니다.' });
    }

    res.status(200).json({ available: true });
  } catch (err) {
    console.error('❌ 아이디 중복 체크 오류:', err.message);
    res.status(500).json({ message: '서버 오류' });
  }
};