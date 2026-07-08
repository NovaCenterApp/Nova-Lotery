// Motor de cálculo de Nova Lotery
// Traduce cualquier jugada (fijo/corrido/parlet/candado) en sus "combinaciones"
// individuales para efectos de validación de tope y exposición acumulada.

// Genera todos los pares posibles de un array de números (sin repetir combinaciones)
function generarPares(numeros) {
  const pares = []
  for (let i = 0; i < numeros.length; i++) {
    for (let j = i + 1; j < numeros.length; j++) {
      pares.push([numeros[i], numeros[j]].sort().join('-'))
    }
  }
  return pares
}

// Devuelve la lista de "combinaciones de exposición" que genera una jugada.
// Cada combinación tiene: { combinacion, tipo, monto }
// - fijo/corrido: la combinación es el número mismo
// - parlet: la combinación es el par de números
// - candado: se descompone en todos sus pares, repartiendo el monto en partes iguales
export function descomponerJugada({ tipo, numeros, monto }) {
  if (tipo === 'fijo' || tipo === 'corrido') {
    return [{ combinacion: numeros[0], tipo, monto }]
  }

  if (tipo === 'parlet') {
    const combinacion = [...numeros].sort().join('-')
    return [{ combinacion, tipo: 'parlet', monto }]
  }

  if (tipo === 'candado') {
    const pares = generarPares(numeros)
    const montoPorPar = monto / pares.length
    return pares.map((combinacion) => ({
      combinacion,
      tipo: 'parlet',
      monto: montoPorPar,
    }))
  }

  throw new Error(`Tipo de jugada desconocido: ${tipo}`)
}

// Dado el detalle de combinaciones de una jugada nueva, el tope de la lista,
// y los acumuladores actuales, determina cuáles combinaciones exceden su tope.
// Devuelve { excedentes, permitido } donde:
// - excedentes: array de { combinacion, tipo, montoExcedente }
// - permitido: true si NINGUNA combinación excede (jugada se puede registrar completa)
export function validarTopes({ combinaciones, topesPorTipo, acumuladoresActuales }) {
  const excedentes = []

  for (const combo of combinaciones) {
    const clave = `${combo.tipo}:${combo.combinacion}`
    const acumuladoActual = acumuladoresActuales[clave] || 0
    const tope = topesPorTipo[combo.tipo]
    const nuevoTotal = acumuladoActual + combo.monto

    if (nuevoTotal > tope) {
      excedentes.push({
        combinacion: combo.combinacion,
        tipo: combo.tipo,
        montoExcedente: +(nuevoTotal - tope).toFixed(2),
      })
    }
  }

  return { excedentes, permitido: excedentes.length === 0 }
}

// --- Cálculo de premios (se usa al liquidar un turno, no en captura) ---

// Cuenta cuántos pares ganadores (posicionales) contiene una combinación de candado/parlet.
// numerosGanadores = [n1, n2, n3] en orden (n1 = fijo, todos = corridos)
export function contarAciertosPar(combinacion, numerosGanadores) {
  const paresGanadores = generarPares(numerosGanadores) // pos1-pos2, pos1-pos3, pos2-pos3 (posicional)
  return paresGanadores.filter((p) => p === combinacion).length
}

export function calcularPremioCandado({ numeros, monto, numerosGanadores, multiplicadorParlet }) {
  const pares = generarPares(numeros)
  const montoPorPar = monto / pares.length
  let totalAciertos = 0

  for (const par of pares) {
    totalAciertos += contarAciertosPar(par, numerosGanadores)
  }

  const montoEquivalente = montoPorPar * totalAciertos
  const premio = montoEquivalente * multiplicadorParlet
  return { montoEquivalente: +montoEquivalente.toFixed(2), premio: +premio.toFixed(2) }
}
