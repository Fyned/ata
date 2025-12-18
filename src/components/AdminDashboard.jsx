import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { FileText, Calendar, Mail, Phone, ExternalLink, Loader2, LogOut, Lock, MapPin } from 'lucide-react'

export default function AdminDashboard() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState(null)
  const [applications, setApplications] = useState([])

  // 1. Sayfa Yüklendiğinde Oturum ve Rol Kontrolü
  useEffect(() => {
    checkSessionAndRole()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        checkRole(session.user.id)
      } else {
        setIsAdmin(false)
        setApplications([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Oturumu kontrol et
  const checkSessionAndRole = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    setSession(session)
    
    if (session) {
      await checkRole(session.user.id)
    } else {
      setLoading(false)
    }
  }

  // Kullanıcının veritabanındaki rolünü kontrol et
  const checkRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single()

      if (data && data.role === 'admin') {
        setIsAdmin(true)
        fetchApplications()
      } else {
        setIsAdmin(false)
      }
    } catch (error) {
      console.error('Rol kontrolü hatası:', error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  // 2. Başvuruları Çek
  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error) setApplications(data)
  }

  // 3. Giriş Yap
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAuthError(null)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setAuthError("Giriş başarısız: " + error.message)
      setLoading(false)
    }
  }

  // 4. Çıkış Yap
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setIsAdmin(false)
    setApplications([])
  }

  // Helper
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  // --- EKRAN 1: Yükleniyor ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // --- EKRAN 2: Giriş Ekranı (Oturum yoksa) ---
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-slate-100">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <Lock className="h-6 w-6" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Admin Girişi</h2>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="admin@ataaccountancy.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg text-center">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              Giriş Yap
            </button>
          </form>
        </div>
      </div>
    )
  }

  // --- EKRAN 3: Yetkisiz Giriş ---
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-slate-100">
          <Lock className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Yetkisiz Erişim</h3>
          <p className="mt-2 text-sm text-slate-500">
            Hesabınız doğrulandı ancak <strong>Admin</strong> yetkisine sahip değilsiniz.
          </p>
          <button onClick={handleLogout} className="mt-6 text-red-600 font-medium hover:underline">Çıkış Yap</button>
        </div>
      </div>
    )
  }

  // --- EKRAN 4: Admin Paneli ---
  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Paneli</h1>
            <p className="text-slate-500 mt-1">Hoş geldin, {session.user.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white border border-slate-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            Güvenli Çıkış
          </button>
        </div>

        {/* Tablo */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {applications.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Henüz başvuru yok.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-slate-800 font-bold border-b border-slate-200 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Başvuru Sahibi</th>
                    <th className="px-6 py-4">İletişim</th>
                    <th className="px-6 py-4">Adres</th> {/* Yeni Kolon */}
                    <th className="px-6 py-4">Tarih</th>
                    <th className="px-6 py-4 text-right">Belgeler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      
                      {/* Ad Soyad */}
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {app.full_name}
                        {app.notes && (
                           <div className="text-xs text-slate-400 font-normal mt-1 truncate max-w-[150px]" title={app.notes}>Not: {app.notes}</div>
                        )}
                      </td>
                      
                      {/* İletişim */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs text-slate-500 gap-1">
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3"/> {app.email}</span>
                          {app.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3"/> {app.phone}</span>}
                        </div>
                      </td>

                      {/* Adres (Yeni Alan) */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-1 text-slate-600 max-w-[200px]">
                          <MapPin className="h-3 w-3 mt-1 shrink-0 text-slate-400" />
                          <span className="truncate" title={app.address}>{app.address || '-'}</span>
                        </div>
                      </td>

                      {/* Tarih */}
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(app.created_at)}
                        </div>
                      </td>

                      {/* Belgeler (Pasaport ve Fatura) */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <a 
                            href={app.passport_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md text-xs transition-colors"
                          >
                            <FileText className="h-3 w-3" /> Pasaport
                          </a>
                          
                          {app.bill_url && (
                            <a 
                              href={app.bill_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 font-medium bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md text-xs transition-colors"
                            >
                              <FileText className="h-3 w-3" /> Fatura
                            </a>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}