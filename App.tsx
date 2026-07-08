import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login.jsx'
import CapturaJugada from './CapturaJugada.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [listaId, setListaId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) cargarListaDelListero(data.session)
      else setCargando(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s) cargarListaDelListero(s)
      else {
        setListaId(null)
        setCargando(false)
      }
    })

    return () => listener.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function cargarListaDelListero(s) {
    setCargando(true)
    setError(null)

    const { data: listero, error: errListero } = await supabase
      .from('listeros')
      .select('id')
      .eq('auth_user_id', s.user.id)
      .maybeSingle()

    if (errListero || !listero) {
      setError(
        'Tu cuenta no está vinculada a ningún listero todavía.\n\nTu ID de usuario es:\n' + s.user.id
      )
      setCargando(false)
      return
    }

    const { data: listas } = await supabase
      .from('listas')
      .select('id, nombre')
      .eq('listero_id', listero.id)

    if (!listas || listas.length === 0) {
      setError('No tienes ninguna lista asignada todavía.')
      setCargando(false)
      return
    }

    setListaId(listas[0].id)
    setCargando(false)
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    setSession(null)
    setListaId(null)
  }

  return (
    <div className="phone-wrap">
      <div className="phone">
        <div className="topbar">
          <div className="topbar-row1">
            <div className="lista-select">Nova Lotery</div>
            {session && (
              <button
                className="btn btn-outline"
                style={{ width: 'auto', padding: '6px 14px', fontSize: 12 }}
                onClick={cerrarSesion}
              >
                Salir
              </button>
            )}
          </div>
        </div>
        <div className="content-area">
          {cargando ? (
            <div className="pantalla-msg">Cargando...</div>
          ) : !session ? (
            <Login onLogin={setSession} />
          ) : error ? (
            <div className="pantalla-msg-sm" style={{ whiteSpace: 'pre-wrap' }}>
              {error}
            </div>
          ) : (
            <CapturaJugada listaId={listaId} />
          )}
        </div>
      </div>
    </div>
  )
}
