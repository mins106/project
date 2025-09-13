// /middlewares/requireAuth.js
const jwt = require("jsonwebtoken");

module.exports = function requireAuth(req, res, next) {
  // 1) 세션 기반 우선
  if (req.session?.user) {
    // auth.js에서 req.session.user = { id, user_id?, student_id?, name, ... } 형태
    const u = req.session.user;
    req.user = {
      id: u.id,
      user_id: u.user_id ?? u.userId,
      student_id: u.student_id ?? u.studentId,
      name: u.name,
    };
    return next();
  }

  // 2) JWT (Authorization 헤더 또는 쿠키 token)
  const bearer = req.headers.authorization?.replace("Bearer ", "");
  const cookieToken = req.cookies?.token;
  const token = bearer || cookieToken;
  if (!token) return res.status(401).json({ ok: false, error: "NO_AUTH" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id?, user_id?, student_id? ... }
    return next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: "INVALID_TOKEN" });
  }
};