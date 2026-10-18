
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
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
      const messages = {
        'auth/email-already-in-use': 'อีเมลนี้ถูกใช้งานแล้ว',
        'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
        'auth/weak-password': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
        'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
        'auth/too-many-requests': 'ลองใหม่อีกครั้งภายหลัง',
      }

      setError(messages[err.code] || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">▦ Stock<span>Wise</span></div>
        <h1>{isRegister ? 'สร้างบัญชีผู้ใช้' : 'เข้าสู่ระบบ'}</h1>
        <p>ระบบบริหารสินค้าคงคลังสำหรับร้านค้าปลีก</p>

        <label>
          อีเมล
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
          />
        </label>

        <label>
          รหัสผ่าน
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="อย่างน้อย 6 ตัวอักษร"
          />
        </label>

        {error && <div className="login-error">{error}</div>}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading
            ? 'กำลังดำเนินการ...'
            : isRegister
              ? 'สมัครสมาชิก'
              : 'เข้าสู่ระบบ'}
        </button>

        <button
          className="login-switch"
          type="button"
          onClick={() => {
            setIsRegister(!isRegister)
            setError('')
          }}
        >
          {isRegister
            ? 'มีบัญชีแล้ว? เข้าสู่ระบบ'
            : 'ยังไม่มีบัญชี? สมัครสมาชิก'}
        </button>
      </form>
    </div>
  )
}

export default Login
