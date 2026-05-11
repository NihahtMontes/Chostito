import { useState, useEffect } from 'react'
import Modal from '../../components/Modal'

export default function AdminLugares() {
  const [lugares, setLugares] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ nombre: '', direccion: '', pais: '', ciudad: '', ambiente: '', capacidadTotal: '', latitud: '', longitud: '' })
  const [loading, setLoading] = useState(true)
  const t = () => localStorage.getItem('token')

  const cargar = () => fetch('/api/lugares').then(r => r.json()).then(setLugares).finally(() => setLoading(false))
  useEffect(() => { cargar() }, [])

  const openModal = (l = null) => {
    setForm(l ? { ...l, capacidadTotal: String(l.capacidadTotal || ''), latitud: String(l.latitud || ''), longitud: String(l.longitud || '') } : { nombre: '', direccion: '', pais: '', ciudad: '', ambiente: '', capacidadTotal: '', latitud: '', longitud: '' })
    setModal(l ? 'edit' : 'create')
  }

  const handleSave = async () => {
    const data = { ...form, capacidadTotal: Number(form.capacidadTotal) || 0, latitud: form.latitud ? Number(form.latitud) : null, longitud: form.longitud ? Number(form.longitud) : null }
    if (modal === 'create') { await fetch('/api/lugares', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t()}` }, body: JSON.stringify(data) }) }
    else { await fetch(`/api/lugares/${form.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t()}` }, body: JSON.stringify(data) }) }
    setModal(null); cargar()
  }

  const handleDelete = async (id) => { if (!confirm('Eliminar?')) return; await fetch(`/api/lugares/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t()}` } }); cargar() }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold text-text">Lugares</h1>
        <button onClick={() => openModal()} className="px-5 py-2.5 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all">+ Nuevo</button>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div> :
        <div className="space-y-2">
          {lugares.map(l => (
            <div key={l.id} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-text">{l.nombre}</p>
                  <p className="text-xs text-text-light">{l.direccion}</p>
                  <p className="text-xs text-text-light">{l.ciudad}, {l.pais} · {l.ambiente} · {l.capacidadTotal} pers.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(l)} className="px-3 py-1.5 text-xs font-bold bg-primary/10 text-primary rounded-xl hover:bg-primary/20">Editar</button>
                  <button onClick={() => handleDelete(l.id)} className="px-3 py-1.5 text-xs font-bold bg-error-light text-error rounded-xl hover:bg-error/20">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>}

      <Modal open={!!modal} onClose={() => setModal(null)} size="sm">
        <h3 className="text-xl font-extrabold text-text mb-4">{modal === 'create' ? 'Nuevo' : 'Editar'} lugar</h3>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="w-full px-4 py-3 bg-surface-alt border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
          <input type="text" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Dirección" className="w-full px-4 py-3 bg-surface-alt border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} placeholder="Ciudad" className="w-full px-4 py-3 bg-surface-alt border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
            <input type="text" value={form.pais} onChange={e => setForm({ ...form, pais: e.target.value })} placeholder="País" className="w-full px-4 py-3 bg-surface-alt border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={form.ambiente} onChange={e => setForm({ ...form, ambiente: e.target.value })} placeholder="Ambiente" className="w-full px-4 py-3 bg-surface-alt border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
            <input type="number" value={form.capacidadTotal} onChange={e => setForm({ ...form, capacidadTotal: e.target.value })} placeholder="Capacidad" className="w-full px-4 py-3 bg-surface-alt border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={form.latitud} onChange={e => setForm({ ...form, latitud: e.target.value })} placeholder="Latitud (opc)" className="w-full px-4 py-3 bg-surface-alt border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
            <input type="text" value={form.longitud} onChange={e => setForm({ ...form, longitud: e.target.value })} placeholder="Longitud (opc)" className="w-full px-4 py-3 bg-surface-alt border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.direccion + ' ' + form.ciudad + ' ' + form.pais)}`)} type="button" className="w-full py-2 text-sm font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors">🗺️ Abrir Google Maps y pegar coordenadas</button>
          <button onClick={handleSave} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all">Guardar</button>
        </div>
      </Modal>
    </div>
  )
}
