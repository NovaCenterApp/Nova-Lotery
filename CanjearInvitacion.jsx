import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function CanjearInvitacion({ onListo }) {
  const [codigo, setCodigo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  async function canjear() {
    setCargando(true)
    setMensaje('')
    const { data, error } = await supabase.rpc('redeem_invite', { p_codigo: codigo.trim().toUpperCase() })
    setCargando(false)
    if (error) { setMensaje('Error: ' + error.message); return }
    if (!data.success) { setMensaje(data.error); return }
    onListo()
  }

  return (
    <div>
      <div className="card">
        <div className="field-label">Código de invitación</div>
        <input className="monto-input" style={{ fontSize: 18, textAlign: 'center', letterSpacing: '0.05em' }} value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="XXXX-XXXX" />
      </div>
      {mensaje && <div className="pantalla-msg-sm">{mensaje}</div>}
      <button className="btn btn-accent" onClick={canjear} disabled={cargando || !codigo}>
        {cargando ? 'Verificando...' : 'Unirme'}
      </button>
    </div>
  )
}
