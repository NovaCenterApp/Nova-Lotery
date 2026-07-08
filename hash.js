// Genera un hash SHA-256 de una jugada, encadenado al hash de la jugada anterior.
// Esto protege el orden e integridad de las jugadas sin depender de la hora del sistema.
export async function generarHash({ listaId, tipo, numeros, monto, timestampLocal, hashAnterior }) {
  const contenido = JSON.stringify({
    listaId,
    tipo,
    numeros,
    monto,
    timestampLocal,
    hashAnterior: hashAnterior || null,
  })

  const encoder = new TextEncoder()
  const data = encoder.encode(contenido)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
