import { useState, useEffect } from 'react'
import CapturaJugada from './CapturaJugada.jsx'

export default function App() {
  const [listaId, setListaId] = useState('')
  const [listaGuardada, setListaGuardada] = useState(null)

  useEffect(() => {
    const guardada = localStorage.getItem('nova_lista_id_temporal')
    if (guardada) {
      setListaId(guardada)
      setListaGuardada(guardada)
    }
  }, [])

  function confirmarLista() {
    localStorage.setItem('nova_lista_id_temporal', listaId)
    setListaGuardada(listaId)
  }

  function cambiarLista() {
    setListaGuardada(null)
  }

  return (
    <div className="phone-wrap">
      <div className="phone">
        <div className="topbar">
          <div className="topbar-row1">
            <div className="lista-select">Nova Lotery</div>
          </div>
        </div>
        <div className="content-area">
          {!listaGuardada ? (
            <div className="config-inicial">
              <div className="field-label">ID de Lista (temporal, hasta implementar login)</div>
              <input
                className="monto-input"
                placeholder="Pega aquí el UUID de la lista"
                value={listaId}
                onChange={(e) => setListaId(e.target.value)}
              />
              <button className="btn btn-accent" style={{ marginTop: 12 }} onClick={confirmarLista}>
                Entrar a capturar
              </button>
              <p className="pantalla-msg-sm">
                Este paso es solo temporal para probar la pantalla mientras construimos
                el login real. Toma el ID de una fila de la tabla <code>listas</code> en Supabase.
              </p>
            </div>
          ) : (
            <>
              <CapturaJugada listaId={listaGuardada} />
              <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={cambiarLista}>
                Cambiar de lista
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
