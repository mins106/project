const express = require('express');
const router = express.Router();
const { signUp, login, checkUserId } = require('../controllers/authController');

// 회원가입
router.post('/signup', signUp);

// 로그인
router.post('/login', login);

// 아이디 중복 확인
router.get('/check-id', checkUserId);

module.exports = router;