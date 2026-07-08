import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login.jsx'
import RoleSelect from './RoleSelect.jsx'
import BancaHome from './BancaHome.jsx'
import CapturaJugada from './CapturaJugada.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [rol, setRol] = useState(null)
  const [listaId, setListaId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) verificarRol(data.session)
      else setCargando(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s) verificarRol(s)
      else { setRol(null); setListaId(null); setCargando(false) }
    })

    return () => listener.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function verificarRol(s) {
    setCargando(true)
    setError(null)

    const { data: banca } = await supabase
      .from('bancas').select('id').eq('auth_user_id', s.user.id).maybeSingle()

    if (banca) { setRol('banca'); setCargando(false); return }

    const { data: listero } = await supabase
      .from('listeros').select('id').eq('auth_user_id', s.user.id).maybeSingle()

    if (listero) { setRol('listero'); await cargarListaDelListero(listero.id); return }

    setRol(null)
    setCargando(false)
  }

  async function cargarListaDelListero(listeroId) {
    const { data: listas } = await supabase
      .from('listas').select('id, nombre').eq('listero_id', listeroId)

    if (!listas || listas.length === 0) {
      setError('No tienes ninguna lista asignada todavía. Pídele a tu banca que te cree una.')
      setCargando(false)
      return
    }
    setListaId(listas[0].id)
    setCargando(false)
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    setSession(null); setRol(null); setListaId(null)
  }

  return (
    <div className="phone-wrap">
      <div className="phone">
        <div className="topbar">
          <div className="topbar-row1">
            <div className="lista-select">Nova Lotery</div>
            {session && (
              <button className="btn btn-outline" style={{ width: 'auto', padding: '6px 14px', fontSize: 12 }} onClick={cerrarSesion}>
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
          ) : rol === null ? (
            <RoleSelect onResuelto={() => verificarRol(session)} />
          ) : rol === 'banca' ? (
            <BancaHome />
          ) : error ? (
            <div className="pantalla-msg-sm" style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
          ) : (
            <CapturaJugada listaId={listaId} />
          )}
        </div>
      </div>
    </div>
  )
}
