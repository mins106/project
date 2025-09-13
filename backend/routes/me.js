// backend/routes/me.js
const express = require('express')
const router = express.Router()

const db = require('../db/database')
const requireAuth = require('../middlewares/requireAuth') // 반드시 존재해야 함 (앞서 만든 파일)
const bcrypt = require('bcryptjs')

router.use(requireAuth)

/** 토큰 기반 현재 사용자 조회
 *  - 로그인 시 JWT payload에 최소 하나(student_id 또는 user_id)를 담아주세요.
 */
async function getCurrentUser(req) {
  if (req.user?.student_id) {
    return await db.get(`SELECT * FROM users WHERE student_id = ?`, [req.user.student_id])
  }
  if (req.user?.user_id) {
    return await db.get(`SELECT * FROM users WHERE user_id = ?`, [req.user.user_id])
  }
  return null
}

/** 공통 페이지네이션 유틸 */
async function listWithPage(sqlBase, params, page, pageSize) {
  const offset = page * pageSize
  const items = await db.all(`${sqlBase} LIMIT ? OFFSET ?`, [...params, pageSize, offset])
  const totalRow = await db.get(`SELECT COUNT(*) AS t FROM (${sqlBase})`, params)
  const total = totalRow?.t || 0
  return { items, hasMore: (page + 1) * pageSize < total }
}

/** GET /api/me
 *  - 내 기본 프로필 + 카운트
 */
router.get('/', async (req, res) => {
  try {
    const user = await getCurrentUser(req)
    if (!user) return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' })

    const counts = await db.get(
      `
      SELECT
        (SELECT COUNT(*) FROM posts    p WHERE p.studentId = ?) AS posts,
        (SELECT COUNT(*) FROM comments c WHERE c.studentId   = ?) AS comments,
        (SELECT COUNT(*) FROM favorites f WHERE f.user_id    = ?) AS favorites
      `,
      [user.student_id, user.student_id, user.id]
    )

    return res.json({
      ok: true,
      user: {
        studentId: user.student_id,
        name: user.name,
        counts: counts || { posts: 0, comments: 0, favorites: 0 },
      },
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' })
  }
})

/** PUT /api/me
 *  - 이름 변경 / 비밀번호 변경(선택)
 *  body: { name?: string, newPassword?: string }
 */
router.put('/', async (req, res) => {
  try {
    const user = await getCurrentUser(req)
    if (!user) return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' })

    const { name, newPassword } = req.body ?? {}

    // 트랜잭션처럼 순차 실행(여기선 sqlite3 run을 그대로 사용)
    if (typeof name === 'string' && name.trim()) {
      await db.run(`UPDATE users SET name = ? WHERE id = ?`, [name.trim(), user.id])
    }

    if (typeof newPassword === 'string' && newPassword.length > 0) {
      const hash = bcrypt.hashSync(newPassword, 10)
      // 스키마상 비번 컬럼 이름이 'password' 임
      await db.run(`UPDATE users SET password = ? WHERE id = ?`, [hash, user.id])
    }

    return res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' })
  }
})

/** GET /api/me/posts?page=0&pageSize=10
 *  - 내가 쓴 글
 */
router.get('/posts', async (req, res) => {
  try {
    const user = await getCurrentUser(req)
    if (!user) return res.status(401).json({ ok: false, error: 'NO_USER' })

    const page = parseInt(req.query.page ?? '0', 10)
    const pageSize = parseInt(req.query.pageSize ?? '10', 10)

    const base = `
      SELECT
        p.id,
        p.title,
        p.tag  AS category,
        p.likes,
        p.comments AS commentCount,
        substr(p.content,1,120) AS snippet
      FROM posts p
      WHERE p.studentId = ?
      ORDER BY p.createdAt DESC
    `
    const payload = await listWithPage(base, [user.student_id], page, pageSize)
    res.json({ ok: true, ...payload })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' })
  }
})

/** GET /api/me/comments?page=0&pageSize=10
 *  - 내가 단 댓글
 */
router.get('/comments', async (req, res) => {
  try {
    const user = await getCurrentUser(req)
    if (!user) return res.status(401).json({ ok: false, error: 'NO_USER' })

    const page = parseInt(req.query.page ?? '0', 10)
    const pageSize = parseInt(req.query.pageSize ?? '10', 10)

    const base = `
      SELECT
        c.id,
        c.postId,
        c.text AS content,
        p.title,
        p.tag  AS category,
        p.likes,
        p.comments AS commentCount
      FROM comments c
      JOIN posts p ON p.id = c.postId
      WHERE c.studentId = ?
      ORDER BY c.createdAt DESC
    `
    const payload = await listWithPage(base, [user.student_id], page, pageSize)

    // 프론트 ListPanel에 맞춰 변환
    payload.items = payload.items.map(r => ({
      id: r.postId,
      title: `[댓글] ${r.title}`,
      category: r.category,
      likes: r.likes,
      commentCount: r.commentCount,
      snippet: r.content,
    }))

    res.json({ ok: true, ...payload })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' })
  }
})

/** GET /api/me/favorites?page=0&pageSize=10
 *  - 즐겨찾기한 글
 */
router.get('/favorites', async (req, res) => {
  try {
    const user = await getCurrentUser(req)
    if (!user) return res.status(401).json({ ok: false, error: 'NO_USER' })

    const page = parseInt(req.query.page ?? '0', 10)
    const pageSize = parseInt(req.query.pageSize ?? '10', 10)

    const base = `
      SELECT
        p.id,
        p.title,
        p.tag  AS category,
        p.likes,
        p.comments AS commentCount,
        substr(p.content,1,120) AS snippet
      FROM favorites f
      JOIN posts p ON p.id = f.post_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `
    const payload = await listWithPage(base, [user.id], page, pageSize)
    res.json({ ok: true, ...payload })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' })
  }
})

module.exports = router
