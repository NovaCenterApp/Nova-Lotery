import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function CrearBanca({ onListo }) {
  const [nombre, setNombre] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  async function crear() {
    setCargando(true)
    setMensaje('')
    const { data, error } = await supabase.rpc('crear_mi_banca', { p_nombre: nombre })
    setCargando(false)
    if (error) { setMensaje('Error: ' + error.message); return }
    if (!data.success) { setMensaje(data.error); return }
    onListo()
  }

  return (
    <div>
      <div className="card">
        <div className="field-label">Nombre de tu Banca</div>
        <input className="monto-input" style={{ fontSize: 15 }} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Banca Los Pinos" />
      </div>
      {mensaje && <div className="pantalla-msg-sm">{mensaje}</div>}
      <button className="btn btn-accent" onClick={crear} disabled={cargando || !nombre}>
        {cargando ? 'Creando...' : 'Crear mi Banca'}
      </button>
    </div>
  )
}
