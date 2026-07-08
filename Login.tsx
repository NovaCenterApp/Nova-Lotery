import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Login({ onLogin }) {
  const [modo, setModo] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  async function entrar() {
    setCargando(true)
    setMensaje('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setCargando(false)
    if (error) {
      setMensaje('Error: ' + error.message)
      return
    }
    onLogin(data.session)
  }

  async function registrar() {
    setCargando(true)
    setMensaje('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    setCargando(false)
    if (error) {
      setMensaje('Error: ' + error.message)
      return
    }
    if (data.user) {
      setMensaje(
        'Cuenta creada.\n\nTu ID de usuario es:\n' +
          data.user.id +
          '\n\nCopia este ID y compártelo para vincularlo a tu banca o listero.'
      )
    }
  }

  return (
    <div>
      <div className="segmented" style={{ marginBottom: 16 }}>
        <div className={`seg ${modo === 'login' ? 'active' : ''}`} onClick={() => setModo('login')}>
          Iniciar sesión
        </div>
        <div className={`seg ${modo === 'registro' ? 'active' : ''}`} onClick={() => setModo('registro')}>
          Crear cuenta
        </div>
      </div>

      <div className="card">
        <div className="field-label">Email</div>
        <input
          className="monto-input"
          style={{ marginBottom: 10, fontSize: 15 }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@ejemplo.com"
        />
        <div className="field-label">Contraseña</div>
        <input
          className="monto-input"
          style={{ fontSize: 15 }}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {mensaje && <div className="pantalla-msg-sm" style={{ whiteSpace: 'pre-wrap' }}>{mensaje}</div>}

      {modo === 'login' ? (
        <button className="btn btn-accent" onClick={entrar} disabled={cargando}>
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>
      ) : (
        <button className="btn btn-accent" onClick={registrar} disabled={cargando}>
          {cargando ? 'Creando...' : 'Crear cuenta'}
        </button>
      )}
    </div>
  )
}
