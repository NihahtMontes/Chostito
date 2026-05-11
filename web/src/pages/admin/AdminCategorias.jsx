import { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import { categoriasApi } from '../../api/categorias'

export default function AdminCategorias() {
  const [cats, setCats] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', icono: '' })
  const [loading, setLoading] = useState(true)

  const cargar = () => categoriasApi.getAll().then(setCats).finally(() => setLoading(false))
  useEffect(() => { cargar() }, [])

  const openModal = (c = null) => { setForm(c || { nombre: '', descripcion: '', icono: '' }); setModal(c ? 'edit' : 'create') }
  const handleSave = async () => {
    try {
      if (modal === 'create') { await categoriasApi.create(form) }
      else { await categoriasApi.update(form.id, form) }
      setModal(null); cargar()
    } catch (e) {
      alert('Error al guardar')
    }
  }
  const handleDelete = async (id) => { 
    if (!window.confirm('¿Eliminar categoría?')) return; 
    try {
      await categoriasApi.delete(id); cargar() 
    } catch (e) {
      alert('Error al eliminar')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-900 text-white" style={{ fontFamily: 'Space Grotesk' }}>Categorías</h1>
          <p className="text-text-secondary mt-1">{cats.length} categoría{cats.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm self-start">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
          Nueva categoría
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : cats.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">📂</div>
          <p className="text-xl font-700 text-white">Sin categorías</p>
          <p className="text-text-secondary mt-2">Crea categorías para organizar tus eventos</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cats.map((c, i) => (
            <div key={c.id} className="card p-5 hover:-translate-y-1 transition-transform duration-300 animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center text-2xl">
                  {c.icono || '🎫'}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(c)} className="p-2 glass rounded-xl text-primary hover:bg-primary/20 transition-colors" title="Editar">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 glass rounded-xl text-error hover:bg-error/20 transition-colors" title="Eliminar">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
              <h3 className="font-800 text-white text-lg mb-1">{c.nombre}</h3>
              <p className="text-sm text-text-light line-clamp-2">{c.descripcion || 'Sin descripción'}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} size="sm">
        <h3 className="text-xl font-900 text-white mb-6" style={{ fontFamily: 'Space Grotesk' }}>
          {modal === 'create' ? 'Nueva categoría' : 'Editar categoría'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-600 text-text-secondary mb-2">Nombre</label>
            <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Conciertos" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-600 text-text-secondary mb-2">Descripción</label>
            <input type="text" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Breve descripción..." className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-600 text-text-secondary mb-2">Ícono (Emoji)</label>
            <input type="text" value={form.icono} onChange={e => setForm({ ...form, icono: e.target.value })} placeholder="🎵" maxLength={2} className="input-field text-center text-xl" />
          </div>
          
          <button onClick={handleSave} className="btn-primary w-full py-3.5 text-base mt-2">
            Guardar
          </button>
        </div>
      </Modal>
    </div>
  )
}
