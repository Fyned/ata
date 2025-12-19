import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { FileText, Calendar, Mail, Phone, Loader2, LogOut, Lock, MapPin, Trash2, Hourglass, CheckCircle, Clock, Activity, Archive, Briefcase } from 'lucide-react'

export default function AdminDashboard() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState(null)
  
  const [applications, setApplications] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  
  // Aktif Sekme State'i (pending | processing | completed)
  const [activeTab, setActiveTab] = useState('pending')

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

  // Rol kontrolü
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
    
    if (!error) {
      const normalizedData = data.map(app => ({
        ...app,
        status: app.status || 'pending'
      }))
      setApplications(normalizedData)
      setSelectedIds([]) 
    } else {
      console.error("Veri çekme hatası:", error)
    }
  }

  // --- TAB (KATEGORİ) FİLTRELEME ---
  const filteredApps = applications.filter(app => app.status === activeTab)

  // Sayıları hesapla
  const counts = {
    pending: applications.filter(app => app.status === 'pending').length,
    processing: applications.filter(app => app.status === 'processing').length,
    completed: applications.filter(app => app.status === 'completed').length
  }

  // --- SEÇİM VE SİLME İŞLEMLERİ ---
  
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filteredApps.map(app => app.id)
      setSelectedIds(allIds)
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  // SİLME İŞLEMİ (Onaylı)
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return

    const confirmMessage = `${selectedIds.length} adet başvuruyu kalıcı olarak silmek istediğinize emin misiniz?`
    if (!window.confirm(confirmMessage)) return

    setLoading(true)

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .in('id', selectedIds)

      if (error) throw error

      setApplications(applications.filter(app => !selectedIds.includes(app.id)))
      setSelectedIds([]) 
      alert("Seçilen kayıtlar başarıyla silindi.")
      
    } catch (error) {
      alert('Silme hatası: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // --- DURUM GÜNCELLEME ---
  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      setApplications(prevApps => prevApps.map(app => 
        app.id === id ? { ...app, status: newStatus } : app
      ))

      if (selectedIds.includes(id)) {
        handleSelectOne(id)
      }

    } catch (error) {
      console.error("Güncelleme hatası:", error)
      alert('Durum güncellenemedi.')
    }
  }

  // Giriş / Çıkış
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setAuthError("Giriş başarısız: " + error.message); setLoading(false) }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null); setIsAdmin(false); setApplications([])
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>

  if (!session) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-slate-100">
        <div className="flex justify-center mb-6"><div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><Lock className="h-6 w-6" /></div></div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Admin Girişi</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
          {authError && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg text-center">{authError}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200">Giriş Yap</button>
        </form>
      </div>
    </div>
  )

  if (!isAdmin) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-slate-100">
        <Lock className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900">Yetkisiz Erişim</h3>
        <button onClick={handleLogout} className="mt-6 text-red-600 font-medium hover:underline">Çıkış Yap</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Paneli</h1>
            <p className="text-slate-500 text-sm">{session.user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-bold shadow-md">
                <Trash2 className="h-4 w-4" /> SEÇİLENLERİ SİL ({selectedIds.length})
              </button>
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 bg-slate-100 text-slate-600 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-medium">
              <LogOut className="h-4 w-4" /> Çıkış
            </button>
          </div>
        </div>

        {/* KATEGORİ SEKMELERİ (TABS) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button 
            onClick={() => { setActiveTab('pending'); setSelectedIds([]) }}
            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              activeTab === 'pending' 
                ? 'bg-white border-blue-500 shadow-md ring-4 ring-blue-50' 
                : 'bg-white border-transparent hover:border-slate-200 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activeTab === 'pending' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                <Clock className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className={`font-bold ${activeTab === 'pending' ? 'text-slate-900' : 'text-slate-600'}`}>İşleme Alınmayanlar</div>
                <div className="text-xs text-slate-400">Bekleyen başvurular</div>
              </div>
            </div>
            <div className={`text-xl font-bold ${activeTab === 'pending' ? 'text-blue-600' : 'text-slate-400'}`}>{counts.pending}</div>
          </button>

          <button 
            onClick={() => { setActiveTab('processing'); setSelectedIds([]) }}
            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              activeTab === 'processing' 
                ? 'bg-white border-amber-500 shadow-md ring-4 ring-amber-50' 
                : 'bg-white border-transparent hover:border-slate-200 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activeTab === 'processing' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                <Activity className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className={`font-bold ${activeTab === 'processing' ? 'text-slate-900' : 'text-slate-600'}`}>İşleme Alınanlar</div>
                <div className="text-xs text-slate-400">İncelenen başvurular</div>
              </div>
            </div>
            <div className={`text-xl font-bold ${activeTab === 'processing' ? 'text-amber-600' : 'text-slate-400'}`}>{counts.processing}</div>
          </button>

          <button 
            onClick={() => { setActiveTab('completed'); setSelectedIds([]) }}
            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              activeTab === 'completed' 
                ? 'bg-white border-green-500 shadow-md ring-4 ring-green-50' 
                : 'bg-white border-transparent hover:border-slate-200 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activeTab === 'completed' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                <Archive className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className={`font-bold ${activeTab === 'completed' ? 'text-slate-900' : 'text-slate-600'}`}>Tamamlananlar</div>
                <div className="text-xs text-slate-400">Biten işlemler</div>
              </div>
            </div>
            <div className={`text-xl font-bold ${activeTab === 'completed' ? 'text-green-600' : 'text-slate-400'}`}>{counts.completed}</div>
          </button>
        </div>

        {/* Tablo */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {filteredApps.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <div className="bg-slate-50 p-4 rounded-full mb-3"><Archive className="h-8 w-8 text-slate-300"/></div>
              Bu kategoride başvuru bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-4 w-10 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        onChange={handleSelectAll}
                        checked={filteredApps.length > 0 && selectedIds.length === filteredApps.length}
                      />
                    </th>
                    {/* YENİ KOLON: Firma İsmi */}
                    <th className="px-4 py-4">Firma İsmi</th>
                    <th className="px-4 py-4">Başvuru Sahibi</th>
                    <th className="px-4 py-4">İletişim</th>
                    <th className="px-4 py-4">Tarih</th>
                    <th className="px-4 py-4 text-center">İşlem</th>
                    <th className="px-4 py-4 text-right">Belgeler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApps.map((app) => (
                    <tr 
                      key={app.id} 
                      className={`transition-colors ${selectedIds.includes(app.id) ? 'bg-blue-50/80' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-4 text-center">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer" checked={selectedIds.includes(app.id)} onChange={() => handleSelectOne(app.id)} />
                      </td>
                      
                      {/* Firma İsmi */}
                      <td className="px-4 py-4">
                         <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                               <Briefcase className="h-4 w-4" />
                            </div>
                            <span className="font-bold text-slate-900">{app.company_name || '-'}</span>
                         </div>
                      </td>

                      {/* Başvuru Sahibi & Adres & Not */}
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">{app.full_name}</div>
                        {app.notes && <div className="text-xs text-slate-400 mt-1 truncate max-w-[150px]" title={app.notes}>Not: {app.notes}</div>}
                        <div className="text-xs text-slate-400 mt-1 max-w-[200px] truncate" title={app.address}><MapPin className="inline h-3 w-3 mr-0.5" />{app.address || '-'}</div>
                      </td>

                      {/* İletişim */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col text-xs text-slate-500 gap-1.5">
                          <span className="flex items-center gap-1 font-medium"><Mail className="h-3 w-3"/> {app.email}</span>
                          {app.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3"/> {app.phone}</span>}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-500 whitespace-nowrap text-xs">
                        <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(app.created_at)}</div>
                      </td>
                      
                      {/* İŞLEM BUTONLARI */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          {activeTab === 'pending' && (
                            <>
                              <button onClick={() => updateStatus(app.id, 'processing')} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold bg-white text-amber-600 border border-amber-200 hover:bg-amber-50">
                                <Hourglass className="h-3.5 w-3.5" /> İşle
                              </button>
                              <button onClick={() => updateStatus(app.id, 'completed')} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold bg-white text-green-600 border border-green-200 hover:bg-green-50">
                                <CheckCircle className="h-3.5 w-3.5" /> Bitir
                              </button>
                            </>
                          )}
                          
                          {activeTab === 'processing' && (
                            <>
                              <button onClick={() => updateStatus(app.id, 'pending')} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold bg-white text-slate-500 border border-slate-200 hover:bg-slate-50">
                                Geri Al
                              </button>
                              <button onClick={() => updateStatus(app.id, 'completed')} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold bg-green-100 text-green-700 ring-2 ring-green-500 border border-green-200 hover:bg-green-200">
                                <CheckCircle className="h-3.5 w-3.5" /> Tamamla
                              </button>
                            </>
                          )}

                          {activeTab === 'completed' && (
                            <button onClick={() => updateStatus(app.id, 'processing')} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold bg-white text-amber-600 border border-amber-200 hover:bg-amber-50">
                              <Hourglass className="h-3.5 w-3.5" /> Tekrar Aç
                            </button>
                          )}
                        </div>
                      </td>

                      {/* BELGELER */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-col gap-2 items-end">
                          <a href={app.passport_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md text-xs w-24 justify-center"><FileText className="h-3 w-3" /> Pasaport</a>
                          {app.bill_url && <a href={app.bill_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-md text-xs w-24 justify-center"><FileText className="h-3 w-3" /> Fatura</a>}
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