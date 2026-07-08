import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { generarHash } from './hash'
import { descomponerJugada, validarTopes } from './motorCalculo'

const TIPOS = [
  { id: 'fijo', label: 'Fijo', campos: 1 },
  { id: 'corrido', label: 'Corrido', campos: 1 },
  { id: 'parlet', label: 'Parlet', campos: 2 },
  { id: 'candado', label: 'Candado', campos: 3 },
]

export default function CapturaJugada({ listaId }) {
  const [tipo, setTipo] = useState('fijo')
  const [numeros, setNumeros] = useState([''])
  const [monto, setMonto] = useState('')
  const [lista, setLista] = useState(null)
  const [turno, setTurno] = useState(null)
  const [recientes, setRecientes] = useState([])
  const [excedentes, setExcedentes] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const tipoActual = TIPOS.find((t) => t.id === tipo)

  // --- Carga inicial: datos de la lista + turno abierto + jugadas recientes ---
  useEffect(() => {
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listaId])

  async function cargarDatos() {
    setCargando(true)
    setError(null)

    const { data: listaData, error: errLista } = await supabase
      .from('listas')
      .select('*')
      .eq('id', listaId)
      .single()

    if (errLista || !listaData) {
      setError('No se pudo cargar la lista. Verifica el ID de lista.')
      setCargando(false)
      return
    }
    setLista(listaData)

    const { data: turnoData, error: errTurno } = await supabase
      .from('turnos')
      .select('*')
      .eq('banca_id', listaData.banca_id)
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (errTurno || !turnoData) {
      setError(
        'No hay un turno abierto para esta banca todavía. Crea uno desde el SQL Editor de Supabase para poder capturar jugadas.'
      )
      setCargando(false)
      return
    }
    setTurno(turnoData)

    const { data: jugadasData } = await supabase
      .from('jugadas')
      .select('*')
      .eq('lista_id', listaId)
      .eq('turno_id', turnoData.id)
      .order('timestamp_local', { ascending: false })
      .limit(10)

    setRecientes(jugadasData || [])
    setCargando(false)
  }

  function cambiarTipo(nuevoTipo) {
    setTipo(nuevoTipo)
    const campos = TIPOS.find((t) => t.id === nuevoTipo).campos
    setNumeros(Array(campos).fill(''))
  }

  function actualizarNumero(index, valor) {
    const copia = [...numeros]
    copia[index] = valor.replace(/\D/g, '').slice(0, 2)
    setNumeros(copia)
  }

  function agregarCampoCandado() {
    setNumeros([...numeros, ''])
  }

  async function obtenerAcumuladores(combinaciones) {
    const claves = combinaciones.map((c) => c.combinacion)
    const { data } = await supabase
      .from('acumulador_exposicion')
      .select('combinacion, tipo, monto_acumulado')
      .eq('lista_id', listaId)
      .eq('turno_id', turno.id)
      .in('combinacion', claves)

    const mapa = {}
    ;(data || []).forEach((row) => {
      mapa[`${row.tipo}:${row.combinacion}`] = Number(row.monto_acumulado)
    })
    return mapa
  }

  async function agregarJugada() {
    setError(null)

    const numerosLimpios = numeros.map((n) => n.padStart(2, '0'))
    const montoNum = parseFloat(monto)

    if (numerosLimpios.some((n) => n === '' || n === '00' && monto === '')) {
      setError('Completa todos los números.')
      return
    }
    if (!montoNum || montoNum <= 0) {
      setError('Ingresa un monto válido.')
      return
    }

    const combinaciones = descomponerJugada({ tipo, numeros: numerosLimpios, monto: montoNum })

    const topesPorTipo = {
      fijo: Number(lista.tope_fijo),
      corrido: Number(lista.tope_corrido),
      parlet: Number(lista.tope_parlet),
    }

    const acumuladoresActuales = await obtenerAcumuladores(combinaciones)
    const { excedentes: listaExcedentes, permitido } = validarTopes({
      combinaciones,
      topesPorTipo,
      acumuladoresActuales,
    })

    if (!permitido) {
      setExcedentes(listaExcedentes)
      return
    }

    // Cadena de hashes: enlaza con la última jugada registrada en esta lista
    const timestampLocal = new Date().toISOString()
    const ultimaJugada = recientes[0]
    const hashAnterior = ultimaJugada ? ultimaJugada.hash_propio : null
    const hashPropio = await generarHash({
      listaId,
      tipo,
      numeros: numerosLimpios,
      monto: montoNum,
      timestampLocal,
      hashAnterior,
    })

    const { data: nuevaJugada, error: errInsert } = await supabase
      .from('jugadas')
      .insert({
        lista_id: listaId,
        turno_id: turno.id,
        tipo,
        numeros: numerosLimpios,
        monto: montoNum,
        timestamp_local: timestampLocal,
        hash_propio: hashPropio,
        hash_anterior: hashAnterior,
        estado_sync: 'confirmado',
      })
      .select()
      .single()

    if (errInsert) {
      setError('No se pudo guardar la jugada: ' + errInsert.message)
      return
    }

    // Actualiza (o crea) el acumulador de exposición para cada combinación afectada
    for (const combo of combinaciones) {
      const clave = `${combo.tipo}:${combo.combinacion}`
      const actual = acumuladoresActuales[clave] || 0
      const nuevoTotal = actual + combo.monto

      await supabase
        .from('acumulador_exposicion')
        .upsert(
          {
            lista_id: listaId,
            turno_id: turno.id,
            combinacion: combo.combinacion,
            tipo: combo.tipo,
            monto_acumulado: nuevoTotal,
          },
          { onConflict: 'lista_id,turno_id,combinacion,tipo' }
        )
    }

    setRecientes([nuevaJugada, ...recientes])
    setNumeros(Array(tipoActual.campos).fill(''))
    setMonto('')
  }

  if (cargando) return <div className="pantalla-msg">Cargando...</div>
  if (error && !lista) return <div className="pantalla-msg error">{error}</div>

  return (
    <div className="captura-screen">
      {turno && (
        <div className="topbar-info">
          {lista?.nombre} · Turno {turno.tipo === 'dia' ? 'Día' : 'Noche'} · {turno.fecha}
        </div>
      )}

      {error && <div className="alerta-error">{error}</div>}

      <div className="segmented">
        {TIPOS.map((t) => (
          <div
            key={t.id}
            className={`seg ${tipo === t.id ? 'active' : ''}`}
            onClick={() => cambiarTipo(t.id)}
          >
            {t.label}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="field-label">Números</div>
        <div className="num-row">
          {numeros.map((n, i) => (
            <input
              key={i}
              className="num-input"
              maxLength={2}
              inputMode="numeric"
              placeholder="00"
              value={n}
              onChange={(e) => actualizarNumero(i, e.target.value)}
            />
          ))}
          {tipo === 'candado' && (
            <button className="add-num-btn" onClick={agregarCampoCandado}>+</button>
          )}
        </div>

        <div className="field-label">Monto</div>
        <input
          className="monto-input"
          inputMode="numeric"
          placeholder="$0"
          value={monto}
          onChange={(e) => setMonto(e.target.value.replace(/\D/g, ''))}
        />
      </div>

      <button className="btn btn-accent" onClick={agregarJugada}>
        Agregar jugada
      </button>

      <div className="recientes">
        <div className="field-label">Agregadas en este turno</div>
        {recientes.length === 0 && (
          <div className="pantalla-msg-sm">Aún no hay jugadas registradas.</div>
        )}
        {recientes.map((j) => (
          <div className="jugada-row" key={j.id}>
            <span className="nums">{j.numeros.join('-')}-${j.monto}</span>
            <span className={`tag tag-${j.tipo}`}>{j.tipo}</span>
          </div>
        ))}
      </div>

      {excedentes && (
        <div className="modal-overlay" onClick={() => setExcedentes(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-header">
              <span className="sheet-title">⚠️ Excedentes</span>
              <span className="sheet-close" onClick={() => setExcedentes(null)}>Cerrar ✕</span>
            </div>
            <div className="warn-box">
              {excedentes.map((ex, i) => (
                <div className="r" key={i}>
                  <span>{ex.combinacion}-${ex.montoExcedente}</span>
                  <span className={`tag tag-${ex.tipo}`}>{ex.tipo}</span>
                </div>
              ))}
            </div>
            <p className="pantalla-msg-sm">
              Esta jugada no se registró porque excede el tope disponible.
              Ajusta el monto, o usa el flujo de reparto/boteo (próxima iteración).
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
