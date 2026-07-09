import { useState } from 'react'
import { supabase } from './supabaseClient'
import BancaListeros from './BancaListeros.jsx'
import BancaResultados from './BancaResultados.jsx'

export default function BancaHome() {
  const [alias, setAlias] = useState('')
  const [codigo, setCodigo] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  async function generar() {
    setCargando(true)
    setMensaje('')
    setCodigo(null)
    const { data, error } = await supabase.rpc('generar_invitacion', { p_alias: alias })
    setCargando(false)
    if (error) { setMensaje('Error: ' + error.message); return }
    if (!data.success) { setMensaje(data.error); return }
    setCodigo(data.codigo)
  }

  return (
    <div>
      <div className="section-title" style={{ marginTop: 0 }}>Invitar Listero</div>
      <div className="card">
        <div className="field-label">Alias del listero</div>
        <input className="monto-input" style={{ fontSize: 15 }} value={alias} onChange={e => setAlias(e.target.value)} placeholder="Ej. Pedro Martínez" />
      </div>
      <button className="btn btn-dark" onClick={generar} disabled={cargando || !alias}>
        {cargando ? 'Generando...' : 'Generar código'}
      </button>
      {mensaje && <div className="pantalla-msg-sm">{mensaje}</div>}
      {codigo && <div className="code-box">{codigo}</div>}
      {codigo && <p className="pantalla-msg-sm">Válido por 24 horas. Compártelo por WhatsApp.</p>}
            <div style={{ marginTop: 24 }}>
        <BancaListeros />
      </div>
      <div style={{ marginTop: 24 }}>
        <BancaResultados />
      </div>

    </div>
  )
}
