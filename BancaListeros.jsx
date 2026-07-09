import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function BancaListeros() {
  const [listeros, setListeros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [listeroActivo, setListeroActivo] = useState(null)
  const [nombre, setNombre] = useState('')
  const [topeFijo, setTopeFijo] = useState('')
  const [topeCorrido, setTopeCorrido] = useState('')
  const [topeParlet, setTopeParlet] = useState('')
  const [comision, setComision] = useState('')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarListeros()
  }, [])

  async function cargarListeros() {
    setCargando(true)
    const { data: banca } = await supabase.from('bancas').select('id').eq('auth_user_id', (await supabase.auth.getUser()).data.user.id).maybeSingle()
    if (!banca) { setCargando(false); return }
    const { data } = await supabase.from('listeros').select('id, alias').eq('banca_id', banca.id)
    setListeros(data || [])
    setCargando(false)
  }

  async function crearLista() {
    setMensaje('')
    const { data, error } = await supabase.rpc('crear_lista', {
      p_listero_id: listeroActivo,
      p_nombre: nombre,
      p_tope_fijo: parseFloat(topeFijo),
      p_tope_corrido: parseFloat(topeCorrido),
      p_tope_parlet: parseFloat(topeParlet),
      p_comision_pct: parseFloat(comision),
    })
    if (error) { setMensaje('Error: ' + error.message); return }
    if (!data.success) { setMensaje(data.error); return }
    setMensaje('¡Lista creada con éxito!')
    setNombre(''); setTopeFijo(''); setTopeCorrido(''); setTopeParlet(''); setComision('')
    setListeroActivo(null)
  }

  if (cargando) return <div className="pantalla-msg">Cargando...</div>

  return (
    <div>
      <div className="section-title" style={{ marginTop: 0 }}>Tus listeros</div>
      {listeros.length === 0 && <div className="pantalla-msg-sm">Aún no tienes listeros. Invita uno primero.</div>}

      {listeros.map((l) => (
        <div key={l.id}>
          <div className="listero-row" style={{ cursor: 'pointer' }} onClick={() => setListeroActivo(listeroActivo === l.id ? null : l.id)}>
            <span className="nums" style={{ fontSize: 14 }}>{l.alias}</span>
            <span className="pill pill-green">{listeroActivo === l.id ? 'Cerrar' : '+ Nueva lista'}</span>
          </div>

          {listeroActivo === l.id && (
            <div className="card">
              <div className="field-label">Nombre de la lista</div>
              <input className="monto-input" style={{ marginBottom: 10, fontSize: 15 }} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Lista Centro" />
              <div className="field-label">Tope Fijo</div>
              <input className="monto-input" style={{ marginBottom: 10, fontSize: 15 }} inputMode="numeric" value={topeFijo} onChange={e => setTopeFijo(e.target.value)} placeholder="3000" />
              <div className="field-label">Tope Corrido</div>
              <input className="monto-input" style={{ marginBottom: 10, fontSize: 15 }} inputMode="numeric" value={topeCorrido} onChange={e => setTopeCorrido(e.target.value)} placeholder="3000" />
              <div className="field-label">Tope Parlet</div>
              <input className="monto-input" style={{ marginBottom: 10, fontSize: 15 }} inputMode="numeric" value={topeParlet} onChange={e => setTopeParlet(e.target.value)} placeholder="300" />
              <div className="field-label">% Comisión</div>
              <input className="monto-input" style={{ fontSize: 15 }} inputMode="numeric" value={comision} onChange={e => setComision(e.target.value)} placeholder="20" />
            </div>
          )}
          {listeroActivo === l.id && (
            <button className="btn btn-accent" style={{ marginBottom: 16 }} onClick={crearLista}>
              Crear lista
            </button>
          )}
        </div>
      ))}

      {mensaje && <div className="pantalla-msg-sm">{mensaje}</div>}
    </div>
  )
}
