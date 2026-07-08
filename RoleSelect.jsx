import { useState } from 'react'
import CrearBanca from './CrearBanca.jsx'
import CanjearInvitacion from './CanjearInvitacion.jsx'

export default function RoleSelect({ onResuelto }) {
  const [rol, setRol] = useState(null)

  if (rol === 'banca') return <CrearBanca onListo={onResuelto} />
  if (rol === 'listero') return <CanjearInvitacion onListo={onResuelto} />

  return (
    <div>
      <div className="field-label">¿Cómo vas a usar Nova Lotery?</div>
      <button className="btn btn-dark" style={{ marginBottom: 10 }} onClick={() => setRol('banca')}>
        Soy Banca
      </button>
      <button className="btn btn-outline" onClick={() => setRol('listero')}>
        Soy Listero (tengo un código)
      </button>
    </div>
  )
}
