import logo from './assets/retail-inventory-logo.png'
import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from './config/firebase'
import './App.css'

function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email.trim(), password)
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password)
      }
    } catch (err) {
      const messages = {
        'auth/email-already-in-use': 'อีเมลนี้ถูกใช้งานแล้ว',
        'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
        'auth/weak-password': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
        'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
        'auth/too-many-requests': 'ลองใหม่อีกครั้งภายหลัง',
        'auth/network-request-failed': 'เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต',
      }

      setError(messages[err.code] || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-decoration login-decoration-one" />
      <div className="login-decoration login-decoration-two" />

      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <img
          src={logo}
          alt="RETAIL INVENTORY"
          className="login-logo"
          />
          </div>

        <div className="login-heading">
          <h1>{isRegister ? 'สร้างบัญชีผู้ใช้' : 'ยินดีต้อนรับกลับ'}</h1>
          <p>
            {isRegister
              ? 'สร้างบัญชีเพื่อเริ่มต้นใช้งานระบบ'
              : 'เข้าสู่ระบบเพื่อจัดการสินค้าคงคลังของคุณ'}
          </p>
        </div>

        <div className="login-fields">
          <label className="login-field">
            <span>อีเมล</span>
            <div className="login-input-wrap">
              <span className="login-input-icon" aria-hidden="true">@</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
              />
            </div>
          </label>

          <label className="login-field">
            <span>รหัสผ่าน</span>
            <div className="login-input-wrap">
              <span className="login-input-icon" aria-hidden="true">⌑</span>
              <input
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
              />
            </div>
          </label>
        </div>

        {error && (
          <div className="login-error" role="alert">
            <span aria-hidden="true">!</span>
            {error}
          </div>
        )}

        <button
          className="login-submit"
          type="submit"
          disabled={loading}
        >
          {loading
            ? 'กำลังดำเนินการ...'
            : isRegister
              ? 'สร้างบัญชีผู้ใช้'
              : 'เข้าสู่ระบบ'}
          {!loading && <span aria-hidden="true">→</span>}
        </button>

        <div className="login-divider">
          <span>หรือ</span>
        </div>

        <p className="login-switch-text">
          {isRegister ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชีใช่ไหม?'}
          <button
            className="login-switch"
            type="button"
            onClick={() => {
              setIsRegister(!isRegister)
              setError('')
            }}
          >
            {isRegister ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        </p>

        <div className="login-footer">
          <span className="login-footer-dot" />
          ระบบบริหารสินค้าคงคลังสำหรับร้านค้าปลีก
        </div>
      </form>
    </main>
  )
}

export default Login
