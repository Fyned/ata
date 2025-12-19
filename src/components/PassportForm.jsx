import { useState } from 'react'
import { supabase } from '../supabase'
import { Upload, CheckCircle, FileText, User, Mail, Phone, MapPin, Loader2, Globe, MessageCircle, Briefcase } from 'lucide-react'

export default function PassportForm() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [lang, setLang] = useState('en') // Varsayılan dil

  // Dil Sözlüğü
  const t = {
    en: {
      title: "Company Registration Portal",
      subtitle: "Upload your documents and details to start the process.",
      passportLabel: "Passport Image / PDF",
      billLabel: "Proof of Address (Utility Bill)",
      uploadText: "Click to upload",
      changeText: "Change file",
      companyName: "Company Name (Mandatory)",
      fullName: "Applicant Full Name",
      email: "Email Address",
      phone: "Phone Number",
      address: "Address",
      notes: "Notes (Optional)",
      submitButton: "Submit Application",
      submitting: "Submitting...",
      successTitle: "Application Received!",
      successMessage: "Your documents have been securely received.",
      important: "IMPORTANT NEXT STEP",
      instruction1: "Please click the button below to notify us via WhatsApp immediately:",
      instruction2: "When you receive a REGISTER CODE in your email, please forward it to this number.",
      whatsappButton: "Notify via WhatsApp",
      whatsappMessage: "Hello, I have completed the passport and document upload process. I am waiting for the next steps.",
      newApplication: "Submit New Application",
      footer: "© 2025 ATA Accountancy. All rights reserved.",
      alertPassport: "Please upload your passport image.",
      alertBill: "Please upload a utility bill for address verification.",
      error: "An error occurred: "
    },
    tr: {
      title: "Şirket Kayıt Portalı",
      subtitle: "İşlemleri başlatmak için belgelerinizi ve bilgilerinizi yükleyin.",
      passportLabel: "Pasaport Görseli / PDF",
      billLabel: "Adres Kanıtı (Fatura)",
      uploadText: "Yüklemek için tıklayın",
      changeText: "Dosyayı değiştir",
      companyName: "Firma İsmi (Zorunlu)",
      fullName: "Başvuran Ad Soyad",
      email: "E-posta Adresi",
      phone: "Telefon Numarası",
      address: "Adres",
      notes: "Notlar (Opsiyonel)",
      submitButton: "Başvuruyu Gönder",
      submitting: "Gönderiliyor...",
      successTitle: "Başvuru Alındı!",
      successMessage: "Belgeleriniz güvenli bir şekilde bize ulaştı.",
      important: "ÖNEMLİ SONRAKİ ADIM",
      instruction1: "Lütfen aşağıdaki butona tıklayarak WhatsApp üzerinden bize hemen bilgi verin:",
      instruction2: "Mailinize bir KAYIT KODU (Register Code) geldiğinde, bu kodu aynı numaraya iletmeniz gerekmektedir.",
      whatsappButton: "WhatsApp ile Bildir",
      whatsappMessage: "Merhaba, pasaport ve belge yükleme işlemlerini tamamladım. Sonraki adımları bekliyorum.",
      newApplication: "Yeni Başvuru Yap",
      footer: "© 2025 ATA Accountancy. Tüm hakları saklıdır.",
      alertPassport: "Lütfen pasaport görselini yükleyiniz.",
      alertBill: "Lütfen adres teyidi için bir fatura görseli yükleyiniz.",
      error: "Bir hata oluştu: "
    }
  }

  const text = t[lang]

  // Form Verileri
  const [formData, setFormData] = useState({ 
    companyName: '', 
    fullName: '', 
    email: '', 
    phone: '', 
    address: '', 
    notes: '' 
  })
  
  // Dosya State'leri
  const [passportFile, setPassportFile] = useState(null)
  const [billFile, setBillFile] = useState(null)

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  // Dosya Yükleme Yardımcısı
  const uploadToSupabase = async (file) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const { error } = await supabase.storage.from('documents').upload(fileName, file)
    if (error) throw error
    const { data } = supabase.storage.from('documents').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!passportFile) { alert(text.alertPassport); setLoading(false); return }
      if (!billFile) { alert(text.alertBill); setLoading(false); return }

      // 1. Dosyaları Yükle
      const passportUrl = await uploadToSupabase(passportFile)
      const billUrl = await uploadToSupabase(billFile)

      // 2. Veritabanına Kaydet
      const { error: dbError } = await supabase.from('applications').insert([{
        company_name: formData.companyName,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        notes: formData.notes,
        passport_url: passportUrl,
        bill_url: billUrl
      }])

      if (dbError) throw dbError

      // 3. Mail Gönder
      await supabase.functions.invoke('send-application-email', {
        body: {
          companyName: formData.companyName,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          notes: formData.notes,
          passportUrl,
          billUrl
        }
      })

      setSubmitted(true)

    } catch (error) {
      alert(text.error + error.message)
    } finally {
      setLoading(false)
    }
  }

  // --- BAŞARI EKRANI (POP-UP MESAJI) ---
  if (submitted) {
    const whatsappNumber = "447388494588"
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text.whatsappMessage)}`

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-lg w-full text-center border border-slate-100 relative overflow-hidden">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">{text.successTitle}</h2>
          <p className="text-slate-600 mb-8">{text.successMessage}</p>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg text-left mb-8">
            <h3 className="text-blue-800 font-bold text-lg mb-2 flex items-center gap-2">
              <span className="text-2xl">⚠️</span> {text.important}
            </h3>
            <p className="text-blue-900 mb-4 font-medium text-sm">
              {text.instruction1}
            </p>
            
            <a 
              href={whatsappLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg mb-4"
            >
              <MessageCircle className="w-6 h-6" />
              {text.whatsappButton}
            </a>

            <p className="text-blue-800/80 text-xs leading-relaxed border-t border-blue-200 pt-3">
              {text.instruction2}
            </p>
          </div>

          <button onClick={() => window.location.reload()} className="text-blue-600 font-semibold hover:underline">
            {text.newApplication}
          </button>
        </div>
      </div>
    )
  }

  // --- FORM EKRANI ---
  return (
    <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl w-full space-y-8 bg-white p-8 sm:p-12 rounded-3xl shadow-2xl border border-slate-200 relative">
        
        <button 
          onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}
          className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-sm font-semibold transition-colors text-slate-700 z-10"
        >
          <Globe className="w-4 h-4" />
          {lang === 'en' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
        </button>

        <div className="text-center">
          <div className="flex justify-center mb-6">
             <div className="h-20 w-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 transform rotate-3">
                <FileText className="text-white w-10 h-10" />
             </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">{text.title}</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">{text.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* SOL KOLON: DOSYA YÜKLEME */}
            <div className="space-y-6">
              
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">{text.passportLabel} <span className="text-red-500">*</span></label>
                <div className={`h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-4 transition-all cursor-pointer ${passportFile ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50'}`}>
                  <input type="file" id="passport" accept="image/*,.pdf" onChange={(e) => setPassportFile(e.target.files[0])} className="hidden" />
                  <label htmlFor="passport" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    {passportFile ? (
                      <><CheckCircle className="w-8 h-8 text-green-500 mb-2"/><span className="text-sm font-semibold text-green-700 truncate w-full px-2">{passportFile.name}</span></>
                    ) : (
                      <><Upload className="w-8 h-8 text-blue-400 mb-2"/><span className="text-sm text-slate-600">{text.uploadText}</span></>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">{text.billLabel} <span className="text-red-500">*</span></label>
                <div className={`h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-4 transition-all cursor-pointer ${billFile ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50'}`}>
                  <input type="file" id="bill" accept="image/*,.pdf" onChange={(e) => setBillFile(e.target.files[0])} className="hidden" />
                  <label htmlFor="bill" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    {billFile ? (
                      <><CheckCircle className="w-8 h-8 text-green-500 mb-2"/><span className="text-sm font-semibold text-green-700 truncate w-full px-2">{billFile.name}</span></>
                    ) : (
                      <><FileText className="w-8 h-8 text-blue-400 mb-2"/><span className="text-sm text-slate-600">{text.uploadText}</span></>
                    )}
                  </label>
                </div>
              </div>

            </div>

            {/* SAĞ KOLON: BİLGİLER */}
            <div className="space-y-5">
              
              {/* FIRMA İSMİ (EN ÜSTTE VE ZORUNLU) */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <label className="block text-sm font-bold text-blue-900 mb-2">{text.companyName} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3.5 h-5 w-5 text-blue-500" />
                  <input 
                    type="text" 
                    name="companyName" 
                    required 
                    value={formData.companyName} 
                    onChange={handleChange} 
                    className="block w-full pl-10 pr-3 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold text-slate-800"
                    placeholder="LTD Şirket İsmi" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{text.fullName} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{text.email} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{text.phone} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{text.address} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <textarea name="address" required rows="2" value={formData.address} onChange={handleChange} className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white resize-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{text.notes}</label>
              <textarea name="notes" rows="3" value={formData.notes} onChange={handleChange} className="block w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white resize-none" />
            </div>

            <button type="submit" disabled={loading} className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-xl shadow-blue-200 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? <><Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> {text.submitting}</> : text.submitButton}
            </button>
          </div>

        </form>
        
        <p className="text-center text-sm text-slate-400 mt-4">{text.footer}</p>
      </div>
    </div>
  )
}