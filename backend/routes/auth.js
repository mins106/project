// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { signUp, login, checkUserId } = require('../controllers/authController');

/**
 * 컨트롤러 응답을 가로채서, { ok:true, user:{id,...} } 형태면 세션에 저장.
 * (컨트롤러 코드를 수정하지 않아도 동작)
 */
function attachSessionOnJson(req, res, next) {
  const origJson = res.json.bind(res);
  res.json = (body) => {
    try {
      // 컨트롤러가 내려준 결과에서 user를 찾아봄
      const user = body?.user || res.locals?.user;
      if (body && body.ok && user && user.id) {
        // 세션에 유저 심기
        if (req.session) req.session.user = user;
      }
    } catch (_) {
      /* noop */
    }
    return origJson(body);
  };
  next();
}

// 회원가입 (원래 컨트롤러 그대로 사용)
// - 회원가입 직후 자동 로그인까지 원하면 attachSessionOnJson을 signUp에도 붙여주면 됨.
router.post('/signup', signUp);

// 로그인 (응답을 가로채 세션 심기)
router.post('/login', attachSessionOnJson, login);

// 아이디 중복 확인
router.get('/check-id', checkUserId);

// (옵션) 현재 로그인 사용자 확인용 엔드포인트 - 다른 코드에 영향 없음
router.get('/whoami', (req, res) => {
  res.json({ ok: true, user: req.session?.user || null });
});

module.exports = router;
