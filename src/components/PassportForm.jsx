import { useState } from 'react'
import { supabase } from '../supabase'
import { Upload, CheckCircle, FileText, User, Mail, Phone, Loader2 } from 'lucide-react'

export default function PassportForm() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  // Form Verileri
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    notes: ''
  })
  
  // Dosya State'i
  const [passportFile, setPassportFile] = useState(null)

  // Input Değişikliği
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Dosya Seçimi
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPassportFile(e.target.files[0])
    }
  }

  // Dosya Yükleme Yardımcısı
  const uploadFile = async (file) => {
    if (!file) throw new Error("Lütfen pasaport görselini yükleyiniz.")
    
    // Dosya ismini benzersiz yap (çakışmayı önlemek için)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    
    const { error } = await supabase.storage
      .from('documents')
      .upload(fileName, file)

    if (error) throw error

    // Public URL al
    const { data } = supabase.storage.from('documents').getPublicUrl(fileName)
    return data.publicUrl
  }

  // --- ANA GÖNDERİM FONKSİYONU ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Kontrol: Dosya var mı?
      if (!passportFile) {
        alert("Lütfen pasaport fotoğrafını yükleyiniz.")
        setLoading(false)
        return
      }

      // 2. Dosyayı Storage'a Yükle
      const passportUrl = await uploadFile(passportFile)

      // 3. Veriyi Veritabanına Kaydet
      const { error: dbError } = await supabase
        .from('applications')
        .insert([{
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes,
          passport_url: passportUrl
        }])

      if (dbError) throw dbError

      // 4. Mail Gönder (Edge Function Tetikle)
      console.log("Mail gönderimi başlatılıyor...")
      
      const { error: mailError } = await supabase.functions.invoke('send-application-email', {
        body: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes,
          passportUrl: passportUrl
        }
      })

      if (mailError) {
        console.error("Mail gönderme hatası:", mailError)
        // Kritik hata değil, veritabanına kayıt yapıldı. Kullanıcıya hissettirmeden devam edebiliriz
        // veya loglara bakabiliriz.
      } else {
        console.log("Mail başarıyla tetiklendi.")
      }

      // 5. Başarılı Ekranına Geç
      setSubmitted(true)

    } catch (error) {
      console.error("Form gönderim hatası:", error)
      alert('Bir hata oluştu: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // --- BAŞARILI EKRANI ---
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-lg w-full text-center border border-slate-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Başvurunuz Alındı!</h2>
          <p className="text-slate-600 mb-8 text-lg">
            Pasaportunuz ve bilgileriniz güvenli bir şekilde bize ulaştı. En kısa sürede inceleyip dönüş yapacağız.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-blue-600 font-semibold hover:underline text-lg"
          >
            Yeni bir başvuru yap
          </button>
        </div>
      </div>
    )
  }

  // --- FORM EKRANI ---
  return (
    <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl w-full space-y-8 bg-white p-8 sm:p-12 rounded-3xl shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
             <div className="h-20 w-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 transform rotate-3">
                <FileText className="text-white w-10 h-10" />
             </div>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Hızlı Pasaport Gönderimi</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            İşlemlerinizi başlatmak için lütfen aşağıdaki formu eksiksiz doldurun.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          
          {/* İki Kolonlu Yapı */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Sol Taraf: Dosya Yükleme */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Pasaport Görseli / PDF <span className="text-red-500">*</span></label>
              <div className={`h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-6 transition-all duration-300 cursor-pointer group
                ${passportFile ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50'}`}>
                <input 
                  type="file" 
                  id="passport-upload" 
                  accept="image/*,.pdf" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <label htmlFor="passport-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                  {passportFile ? (
                    <>
                      <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                      <span className="text-sm font-semibold text-green-700 break-all px-4">{passportFile.name}</span>
                      <span className="text-xs text-green-600 mt-2 bg-green-200 px-2 py-1 rounded-full">Değiştir</span>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                      </div>
                      <span className="text-base font-medium text-slate-700">Yüklemek için tıklayın veya sürükleyin</span>
                      <span className="text-sm text-slate-400 mt-2">JPG, PNG, PDF (Maks 5MB)</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Sağ Taraf: Form Bilgileri */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Ad Soyad <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute left-3 top-3.5 h-5 w-5 flex items-center justify-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    name="fullName" 
                    required 
                    value={formData.fullName} 
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors"
                    placeholder="Pasaporttaki tam adınız" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">E-posta <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute left-3 top-3.5 h-5 w-5 flex items-center justify-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    value={formData.email} 
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors"
                    placeholder="ornek@email.com" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Telefon</label>
                <div className="relative">
                  <div className="absolute left-3 top-3.5 h-5 w-5 flex items-center justify-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors"
                    placeholder="+90 555 000 0000" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Alt Kısım: Notlar ve Buton */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Notlar (Opsiyonel)</label>
              <textarea 
                name="notes" 
                rows="3" 
                value={formData.notes} 
                onChange={handleChange}
                className="block w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors resize-none"
                placeholder="Eklemek istediğiniz bir not var mı?" 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-xl shadow-blue-200 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> 
                  Gönderiliyor...
                </>
              ) : (
                'Bilgileri ve Pasaportu Gönder'
              )}
            </button>
          </div>

        </form>
        
        <p className="text-center text-sm text-slate-400 mt-4">
          © 2025 ATA Accountancy. Bilgileriniz 256-bit SSL ile korunmaktadır.
        </p>
      </div>
    </div>
  )
}