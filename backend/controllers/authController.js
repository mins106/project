// controllers/authController.js
const db = require('../db/database');
const bcrypt = require('bcryptjs');

// 공용: 응답으로 내보낼 안전한 유저 객체
function toSafeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,        // 로그인 아이디
    studentId: row.student_id,  // 학번
    name: row.name,
  };
}

// 회원가입
exports.signUp = async (req, res) => {
  const { studentId, name, userId, password } = req.body;

  if (!studentId || !name || !userId || !password) {
    return res.status(400).json({ ok: false, message: '모든 필드를 입력해주세요.' });
  }

  try {
    const exists = await db.get('SELECT 1 FROM users WHERE user_id = ?', [userId]);
    if (exists) {
      return res.status(409).json({ ok: false, message: '이미 존재하는 아이디입니다.' });
    }

    const hash = bcrypt.hashSync(password, 10);
    await db.run(
      'INSERT INTO users (student_id, name, user_id, password) VALUES (?, ?, ?, ?)',
      [studentId, name, userId, hash]
    );

    // 방금 가입한 유저 조회
    const user = await db.get('SELECT * FROM users WHERE user_id = ?', [userId]);

    // (선택) 가입 즉시 로그인 처리
    if (req.session) {
      req.session.user = toSafeUser(user);
    }

    return res.status(201).json({ ok: true, user: toSafeUser(user) });
  } catch (err) {
    console.error('❌ 회원가입 오류:', err);
    return res.status(500).json({ ok: false, message: '서버 오류로 회원가입 실패' });
  }
};

// 로그인
exports.login = async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ ok: false, message: '아이디와 비밀번호를 입력해주세요.' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE user_id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ ok: false, message: '존재하지 않는 아이디입니다.' });
    }

    let ok;
    // 기존에 평문으로 저장돼 있을 가능성 대비(마이그레이션): $2 로 시작하면 bcrypt
    if (typeof user.password === 'string' && user.password.startsWith('$2')) {
      ok = bcrypt.compareSync(password, user.password);
    } else {
      ok = user.password === password;
      // 평문이 맞으면 즉시 해시로 마이그레이션
      if (ok) {
        const newHash = bcrypt.hashSync(password, 10);
        await db.run('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
      }
    }

    if (!ok) {
      return res.status(401).json({ ok: false, message: '비밀번호가 일치하지 않습니다.' });
    }

    // 세션에 로그인 사용자 저장
    if (req.session) {
      req.session.user = toSafeUser(user);
    }

    // 프론트에서 필요로 하는 필드명 일관화(studentId, userId)
    return res.json({
      ok: true,
      user: toSafeUser(user),
      // 필요하면 디버깅용 세션도 내려줌
      // session: req.session.user,
    });
  } catch (err) {
    console.error('❌ 로그인 오류:', err);
    return res.status(500).json({ ok: false, message: '서버 오류로 로그인 실패' });
  }
};

// 아이디 중복 확인
exports.checkUserId = async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ ok: false, message: '아이디를 입력하세요.' });
  }

  try {
    const row = await db.get('SELECT 1 FROM users WHERE user_id = ?', [userId]);
    if (row) {
      return res.status(409).json({ ok: false, message: '이미 존재하는 아이디입니다.' });
    }
    return res.status(200).json({ ok: true, available: true });
  } catch (err) {
    console.error('❌ 아이디 중복 체크 오류:', err);
    return res.status(500).json({ ok: false, message: '서버 오류' });
  }
};