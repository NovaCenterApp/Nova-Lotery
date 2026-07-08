# Nova Lotery — Captura de Jugada (v0.1)

Esta es la primera pantalla real de la app, conectada a tu base de datos de Supabase.

## Qué hace de verdad
- Guarda cada jugada en tu tabla `jugadas` de Supabase.
- Calcula las combinaciones de cada jugada (fijo/corrido/parlet/candado) con el motor real que diseñamos.
- Valida los topes contra el acumulador de exposición real de la lista, y bloquea si excede.
- Genera la cadena de hashes para proteger el orden/integridad de las jugadas.

## Simplificación temporal (a resolver en la siguiente iteración)
- Todavía no hay login. En vez de eso, la app te pide pegar el **ID de una Lista** para poder probarla.
- Si una jugada (ej. un candado) excede el tope en alguna de sus combinaciones, por ahora se **bloquea completa** — el reparto automático de la parte que sí cabe lo afinamos en la siguiente iteración, junto con el login.

## Datos de prueba (ya creados)

Ya existen en tu Supabase estos registros de prueba, listos para usar:
- Banca: `ad562f38-fd51-4dd1-af48-7fded3fe8a67`
- Listero: `dbfef4f1-c5cc-4b2e-a0d2-d4489a562a5a`
- **Lista de Prueba (usa este ID en la app): `e0215058-2cdc-40e3-939e-51698d5b5542`**
- Turno abierto: `a59382c2-2cf4-4dad-b5a7-bceac9bc79d2`

Si necesitas crear más adelante otra lista/banca/listero de prueba, aquí está el proceso:

```sql
insert into bancas (nombre, usuario, password_hash)
values ('Banca de Prueba', 'banca_test', 'temporal')
returning id;
```
Copia el `id` que te devuelve, y úsalo abajo en `<BANCA_ID>`:

```sql
insert into listeros (banca_id, alias, usuario, password_hash)
values ('<BANCA_ID>', 'Listero de Prueba', 'listero_test', 'temporal')
returning id;
```
Copia el `id` del listero como `<LISTERO_ID>`:

```sql
insert into listas (listero_id, banca_id, nombre, tope_fijo, tope_corrido, tope_parlet, comision_pct)
values ('<LISTERO_ID>', '<BANCA_ID>', 'Lista de Prueba', 3000, 3000, 300, 20)
returning id;
```
Este `id` es el que vas a pegar en la app (**ID de Lista**).

```sql
insert into turnos (banca_id, fecha, tipo)
values ('<BANCA_ID>', current_date, 'noche')
returning id;
```

## Paso 2 — Conseguir tus credenciales de Supabase
1. En tu proyecto de Supabase, ve a **Project Settings → API**.
2. Copia el **Project URL** y la clave **anon public**.

## Paso 3 — Subir el proyecto a GitHub
1. Ve a [github.com/new](https://github.com/new) y crea un repositorio nuevo (ej. `nova-lotery`).
2. Usa el botón **"uploading an existing file"** en la página del repo.
3. Selecciona **todos estos archivos sueltos** (no hay carpetas, todos están al mismo nivel):
   `package.json`, `vite.config.js`, `index.html`, `main.jsx`, `App.jsx`, `CapturaJugada.jsx`, `supabaseClient.js`, `hash.js`, `motorCalculo.js`, `index.css`, `.gitignore`, `.env.example`, `README.md`
4. Dale a **"Commit changes"**.

## Paso 4 — Publicar con Vercel
1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Dale a **"Add New Project"** y selecciona el repositorio `nova-lotery`.
3. En **Environment Variables**, agrega:
   - `VITE_SUPABASE_URL` → tu Project URL
   - `VITE_SUPABASE_ANON_KEY` → tu clave anon
4. Dale a **Deploy**. Vercel instala dependencias y construye la app automáticamente — no necesitas ejecutar nada en tu computadora.
5. En 1-2 minutos tendrás un link público (ej. `nova-lotery.vercel.app`) donde probar la pantalla real.

## Qué probar una vez publicada
- Pega el ID de la Lista de prueba.
- Selecciona un tipo (Fijo, Corrido, Parlet, Candado), mete números y monto, y dale a "Agregar jugada".
- Verifica en Supabase (tabla `jugadas`) que la fila se creó.
- Intenta superar el tope (ej. mete $3,500 en fijo si el tope es $3,000) y confirma que aparece la alerta de excedente sin guardar la jugada.
