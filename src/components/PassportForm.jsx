import { useState } from 'react'
import { supabase } from '../supabase' // Supabase dosyanın yolu

export default function PassportForm() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    passport_number: '',
    email: ''
  })

  // Input değişimlerini yakala
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Formu gönder
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('applications') // Tablo adımız
        .insert([
          { 
            full_name: formData.full_name, 
            passport_number: formData.passport_number,
            email: formData.email
          }
        ])

      if (error) throw error
      alert('Başvuru başarıyla alındı!')
      setFormData({ full_name: '', passport_number: '', email: '' }) // Formu temizle

    } catch (error) {
      alert('Hata oluştu: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Pasaport Başvuru Portalı</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Ad Soyad */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Ad Soyad</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="Örn: Ahmet Yılmaz"
            />
          </div>

          {/* Pasaport No */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Pasaport Numarası</label>
            <input
              type="text"
              name="passport_number"
              value={formData.passport_number}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="U12345678"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">E-posta Adresi</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="ahmet@ornek.com"
            />
          </div>

          {/* Buton */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-300 disabled:opacity-50"
          >
            {loading ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
          </button>

        </form>
      </div>
    </div>
  )
}