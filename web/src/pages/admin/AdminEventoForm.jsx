import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { eventosApi } from '../../api/eventos'
import { categoriasApi } from '../../api/categorias'
import { lugaresApi } from '../../api/lugares'

const ESTADOS = ['Borrador', 'Publicado', 'Cancelado', 'Finalizado']
const TIPOS = ['VIP', 'General', 'Platea', 'Palco', 'Campo']

export default function AdminEventoForm() {
  const { id } = useParams()
  const esEdicion = !!id
  const navigate = useNavigate()

  const [form, setForm] = useState({ titulo: '', eslogan: '', descripcion: '', fecha: '', hora: '', estado: 'Borrador', idCategoria: '', idLugar: '' })
  const [categorias, setCategorias] = useState([])
  const [lugares, setLugares] = useState([])
  const [entradas, setEntradas] = useState([{ tipo: 'VIP', precio: '', cantidad: '', seccion: '', asientosPorSeccion: '' }])
  const [imagen, setImagen] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cargando, setCargando] = useState(esEdicion)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([categoriasApi.getAll(), lugaresApi.getAll()]).then(([c, l]) => { setCategorias(c); setLugares(l) })
    if (esEdicion) {
      eventosApi.getById(id).then(ev => {
        setForm({
          titulo: ev.titulo || '', eslogan: ev.eslogan || '', descripcion: ev.descripcion || '',
          fecha: ev.fecha ? ev.fecha.split('T')[0] : '', hora: ev.hora ? ev.hora.substring(0, 5) : '',
          estado: ev.estado || 'Borrador', idCategoria: categorias.find(c => c.nombre === ev.categoria)?.id || ev.idCategoria || '',
          idLugar: lugares.find(l => l.nombre === ev.lugar)?.id || ev.idLugar || '',
        })
        return eventosApi.getEntradas(id)
      }).then(async ent => {
        const mapped = ent.map(e => ({ tipo: e.tipo, precio: String(e.precio), cantidad: String(e.cantidadDisponible), seccion: '', asientosPorSeccion: '' }))
        if (ent.some(e => e.tipo === 'VIP')) {
          try {
            const seats = await eventosApi.getAsientos(id)
            if (seats?.length) {
              const vipIdx = mapped.findIndex(e => e.tipo === 'VIP')
              if (vipIdx !== -1) mapped.splice(vipIdx, 1)
              seats.forEach(s => mapped.push({ tipo: 'VIP', precio: String(ent.find(e => e.tipo === 'VIP')?.precio || ''), cantidad: String(s.asientos.length), seccion: s.seccion, asientosPorSeccion: String(s.asientos.length) }))
            }
          } catch {}
        }
        setEntradas(mapped.length ? mapped : [{ tipo: 'VIP', precio: '', cantidad: '', seccion: '', asientosPorSeccion: '' }])
      }).finally(() => setCargando(false))
    }
  }, [id]) // Removed dependencies for now to avoid loops, but Ideally setCategorias is independent

  const updEntrada = (i, f, v) => {
    setEntradas(prev => {
      const u = [...prev]
      u[i] = { ...u[i], [f]: v }
      return u
    })
  }

  const addEntrada = () => setEntradas(prev => [...prev, { tipo: 'General', precio: '', cantidad: '', seccion: '', asientosPorSeccion: '' }])
  const remEntrada = (i) => { if (entradas.length > 1) setEntradas(prev => prev.filter((_, idx) => idx !== i)) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const data = {
        titulo: form.titulo.trim(), eslogan: form.eslogan.trim(), descripcion: form.descripcion.trim(),
        fecha: form.fecha, hora: form.hora + ':00', idCategoria: Number(form.idCategoria || categorias[0]?.id), idLugar: Number(form.idLugar || lugares[0]?.id), estado: form.estado,
      }
      let nuevoId = id ? Number(id) : null
      if (esEdicion) { await eventosApi.update(nuevoId, data) }
      else { const r = await eventosApi.create(data); nuevoId = r.id }

      const validas = entradas.filter(e => (e.cantidad || e.asientosPorSeccion) && Number(e.cantidad || e.asientosPorSeccion) > 0 && e.precio && Number(e.precio) > 0)
      if (validas.length && nuevoId) {
        const mapFn = (e) => { 
          const d = { tipo: e.tipo, precio: Number(e.precio), cantidad: Number(e.cantidad || e.asientosPorSeccion) }
          if (e.tipo === 'VIP') { d.seccion = e.seccion || 'VIP'; d.asientosPorSeccion = Number(e.asientosPorSeccion || e.cantidad) } 
          return d 
        }
        if (esEdicion) { await eventosApi.reemplazarEntradas(nuevoId, validas.map(mapFn)) }
        else { for (const ent of validas) { await eventosApi.agregarEntradas(nuevoId, mapFn(ent)) } }
      }

      if (imagen && nuevoId) {
        const fd = new FormData(); fd.append('imagen', imagen)
        await eventosApi.uploadImagen(nuevoId, fd)
      }
      navigate('/admin/eventos')
    } catch (e) { setError(e.response?.data?.message || 'Error al guardar') }
    finally { setLoading(false) }
  }

  if (cargando) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 glass rounded-full hover:bg-white/10 transition-all text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-3xl font-900 text-white" style={{ fontFamily: 'Space Grotesk' }}>{esEdicion ? 'Editar evento' : 'Nuevo evento'}</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-error-light/20 border border-error/30 text-error rounded-xl px-4 py-3 text-sm font-600 mb-6 animate-scale-in">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="font-800 text-white text-lg mb-2">Información general</h2>

          <div>
            <label className="block text-sm font-600 text-text-secondary mb-2">Título del evento</label>
            <input type="text" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required placeholder="Ej: Concierto de Rock" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-600 text-text-secondary mb-2">Eslogan</label>
            <input type="text" value={form.eslogan} onChange={e => setForm({ ...form, eslogan: e.target.value })} required placeholder="Ej: La mejor noche del año" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-600 text-text-secondary mb-2">Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} required rows={4} placeholder="Detalles del evento..." className="input-field resize-none py-3" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-600 text-text-secondary mb-2">Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-600 text-text-secondary mb-2">Hora</label>
              <input type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} required className="input-field" />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <h2 className="font-800 text-white text-lg mb-2">Clasificación y Estado</h2>

          <div>
            <label className="block text-sm font-600 text-text-secondary mb-2">Estado</label>
            <div className="flex flex-wrap gap-2">
              {ESTADOS.map(e => (
                <button key={e} type="button" onClick={() => setForm({ ...form, estado: e })} className={`px-4 py-2 rounded-full text-sm font-700 transition-all ${form.estado === e ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'glass text-text-secondary hover:text-white border border-white/06'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-600 text-text-secondary mb-2">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {categorias.map(c => (
                <button key={c.id} type="button" onClick={() => setForm({ ...form, idCategoria: c.id })} className={`px-4 py-2 rounded-full text-sm font-700 transition-all flex items-center gap-1.5 ${form.idCategoria === c.id || (!form.idCategoria && categorias[0]?.id === c.id) ? 'bg-primary/20 text-primary-light border border-primary/30' : 'glass text-text-secondary hover:text-white border border-white/06'}`}>
                  <span>{c.icono}</span> {c.nombre}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-600 text-text-secondary mb-2">Lugar</label>
            <div className="flex flex-wrap gap-2">
              {lugares.map(l => (
                <button key={l.id} type="button" onClick={() => setForm({ ...form, idLugar: l.id })} className={`px-4 py-2 rounded-full text-sm font-700 transition-all flex items-center gap-1.5 ${form.idLugar === l.id || (!form.idLugar && lugares[0]?.id === l.id) ? 'bg-secondary/20 text-secondary-light border border-secondary/30' : 'glass text-text-secondary hover:text-white border border-white/06'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  {l.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <label className="block text-sm font-600 text-text-secondary mb-4">Imagen del evento</label>
          <div className="border-2 border-dashed border-white/10 bg-surface-alt rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => document.getElementById('imgInput').click()}>
            {imagen ? (
              <div className="relative inline-block">
                <img src={URL.createObjectURL(imagen)} alt="Preview" className="max-h-56 mx-auto rounded-xl shadow-lg" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                  <span className="text-white font-600 text-sm">Cambiar imagen</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <div>
                  <p className="text-white font-600">Click para subir imagen</p>
                  <p className="text-text-light text-xs mt-1">JPG, PNG o WEBP</p>
                </div>
              </div>
            )}
            <input id="imgInput" type="file" accept="image/*" onChange={e => setImagen(e.target.files[0])} className="hidden" />
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-800 text-white text-lg mb-2">Entradas</h2>
          
          {entradas.map((entry, i) => (
            <div key={i} className="bg-surface-alt border border-white/06 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="badge badge-primary">Ticket #{i + 1}</span>
                {entradas.length > 1 && (
                  <button type="button" onClick={() => remEntrada(i)} className="text-error hover:text-red-400 font-bold text-sm p-1">
                    Eliminar
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-600 text-text-secondary mb-2">Tipo de entrada</label>
                <div className="flex flex-wrap gap-2">
                  {TIPOS.map(t => (
                    <button key={t} type="button" onClick={() => updEntrada(i, 'tipo', t)} className={`px-3 py-1.5 rounded-lg text-xs font-700 transition-all ${entry.tipo === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'glass text-text-secondary hover:text-white border border-white/06'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {entry.tipo === 'VIP' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-600 text-text-secondary mb-1">Precio (Bs)</label>
                      <input type="number" value={entry.precio} onChange={e => updEntrada(i, 'precio', e.target.value)} placeholder="150" className="input-field text-sm py-2" />
                    </div>
                    <div>
                      <label className="block text-xs font-600 text-text-secondary mb-1">Sección VIP</label>
                      <input type="text" value={entry.seccion} onChange={e => updEntrada(i, 'seccion', e.target.value)} placeholder="Ej: Platea A" className="input-field text-sm py-2" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-600 text-text-secondary mb-1">Asientos por sección</label>
                    <input type="number" value={entry.asientosPorSeccion !== undefined ? entry.asientosPorSeccion : (entry.cantidad || '')} onChange={e => { const val = e.target.value; setEntradas(prev => { const arr = [...prev]; arr[i] = { ...arr[i], asientosPorSeccion: val, cantidad: val }; return arr; }) }} placeholder="Ej: 50" className="input-field text-sm py-2" />
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-600 text-text-secondary mb-1">Precio (Bs)</label>
                    <input type="number" value={entry.precio} onChange={e => updEntrada(i, 'precio', e.target.value)} placeholder="100" className="input-field text-sm py-2" />
                  </div>
                  <div>
                    <label className="block text-xs font-600 text-text-secondary mb-1">Cantidad total</label>
                    <input type="number" value={entry.cantidad} onChange={e => updEntrada(i, 'cantidad', e.target.value)} placeholder="1000" className="input-field text-sm py-2" />
                  </div>
                </div>
              )}
            </div>
          ))}

          <button type="button" onClick={addEntrada} className="w-full py-3 glass border border-primary/30 rounded-2xl text-sm font-700 text-primary-light hover:bg-primary/10 transition-colors flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Agregar otro tipo de entrada
          </button>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base relative mt-4">
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? 'Guardando cambios...' : esEdicion ? 'Guardar evento' : 'Crear evento'}
          </span>
        </button>
        <div className="h-12" />
      </form>
    </div>
  )
}
