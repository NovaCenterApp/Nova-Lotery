import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function BancaResultados() {
  const [tipo, setTipo] = useState('noche')
  const [num1, setNum1] = useState('')
  const [num2, setNum2] = useState('')
  const [num3, setNum3] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(false)

  async function abrirYGuardar() {
    setCargando(true)
    setMensaje('')
    setResultado(null)

    const { data: abierto, error: errAbrir } = await supabase.rpc('abrir_turno', { p_tipo: tipo })
    if (errAbrir || !abierto.success) {
      setMensaje('Error al abrir turno: ' + (errAbrir?.message || abierto.error))
      setCargando(false)
      return
    }

    const { error: errUpdate } = await supabase
      .from('turnos')
      .update({
        numero_1: num1.padStart(2, '0'),
        numero_2: num2.padStart(2, '0'),
        numero_3: num3.padStart(2, '0'),
      })
      .eq('id', abierto.turno_id)

    if (errUpdate) {
      setMensaje('Error guardando números: ' + errUpdate.message)
      setCargando(false)
      return
    }

    const { data: liq, error: errLiq } = await supabase.rpc('liquidar_turno', { p_turno_id: abierto.turno_id })
    setCargando(false)

    if (errLiq) {
      setMensaje('Error al liquidar: ' + errLiq.message)
      return
    }
    if (!liq.success) {
      setMensaje(liq.error)
      return
    }

    setResultado(liq)
    setMensaje('')
  }

  return (
    <div>
      <div className="section-title" style={{ marginTop: 0 }}>Resultados</div>

      <div className="segmented" style={{ marginBottom: 14 }}>
        <div className={`seg ${tipo === 'dia' ? 'active' : ''}`} onClick={() => setTipo('dia')}>Día</div>
        <div className={`seg ${tipo === 'noche' ? 'active' : ''}`} onClick={() => setTipo('noche')}>Noche</div>
      </div>

      <div className="card">
        <div className="field-label">Números ganadores</div>
        <div className="num-row">
          <input className="num-input" maxLength={2} inputMode="numeric" value={num1} onChange={e => setNum1(e.target.value.replace(/\D/g,''))} placeholder="00" />
          <input className="num-input" maxLength={2} inputMode="numeric" value={num2} onChange={e => setNum2(e.target.value.replace(/\D/g,''))} placeholder="00" />
          <input className="num-input" maxLength={2} inputMode="numeric" value={num3} onChange={e => setNum3(e.target.value.replace(/\D/g,''))} placeholder="00" />
        </div>
      </div>

      <button className="btn btn-accent" onClick={abrirYGuardar} disabled={cargando || !num1 || !num2 || !num3}>
        {cargando ? 'Liquidando...' : 'Confirmar y Liquidar'}
      </button>

      {mensaje && <div className="pantalla-msg-sm">{mensaje}</div>}

      {resultado && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="field-label">Resultado</div>
          <div className="pantalla-msg-sm">
            {resultado.listas_liquidadas} lista(s) liquidada(s) correctamente.
          </div>
        </div>
      )}
    </div>
  )
}
