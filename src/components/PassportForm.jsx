import { useState } from 'react'
import { supabase } from '../supabase'

export default function PassportForm() {
  const [loading, setLoading] = useState(false)
  
  // Şirket Bilgileri State
  const [companyData, setCompanyData] = useState({
    companyName: '',
    officeAddress: '',
    businessActivity: ''
  })

  // Direktörler State
  const [directors, setDirectors] = useState([
    { homeAddress: '', niNumber: '', passportFile: null, brpFile: null }
  ])

  // PSC (Person with Significant Control) State
  const [pscs, setPscs] = useState([]) 

  // --- HANDLERS ---

  const handleCompanyChange = (e) => {
    setCompanyData({ ...companyData, [e.target.name]: e.target.value })
  }

  // Direktör işlemleri
  const handleDirectorChange = (index, field, value) => {
    const newDirectors = [...directors]
    newDirectors[index][field] = value
    setDirectors(newDirectors)
  }
  
  const addDirector = () => {
    setDirectors([...directors, { homeAddress: '', niNumber: '', passportFile: null, brpFile: null }])
  }

  // PSC işlemleri
  const handlePscChange = (index, field, value) => {
    const newPscs = [...pscs]
    newPscs[index][field] = value
    setPscs(newPscs)
  }

  const addPsc = () => {
    setPscs([...pscs, { name: '', address: '', natureOfControl: '' }])
  }

  // Dosya Yükleme Fonksiyonu
  const uploadFile = async (file) => {
    if (!file) return null
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    const { error } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (error) {
      console.error('Upload hatası:', error)
      throw error
    }

    const { data } = supabase.storage.from('documents').getPublicUrl(filePath)
    return data.publicUrl
  }

  // --- FORM SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Şirketi Kaydet
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert([{
          company_name: companyData.companyName,
          office_address: companyData.officeAddress,
          business_activity: companyData.businessActivity
        }])
        .select()
        .single()

      if (companyError) throw companyError
      const companyId = company.id

      // 2. Direktörleri Kaydet
      for (const dir of directors) {
        let passportUrl = null
        let brpUrl = null

        if (dir.passportFile) passportUrl = await uploadFile(dir.passportFile)
        if (dir.brpFile) brpUrl = await uploadFile(dir.brpFile)

        const { error: dirError } = await supabase.from('directors').insert([{
          company_id: companyId,
          home_address: dir.homeAddress,
          ni_number: dir.niNumber,
          passport_url: passportUrl,
          brp_url: brpUrl
        }])
        if (dirError) throw dirError
      }

      // 3. PSC'leri Kaydet
      for (const psc of pscs) {
        const { error: pscError } = await supabase.from('pscs').insert([{
          company_id: companyId,
          name: psc.name,
          address: psc.address,
          nature_of_control: psc.natureOfControl
        }])
        if (pscError) throw pscError
      }

      alert('Başvuru başarıyla alındı! Bilgiler veritabanına kaydedildi.')
      // Başarılı işlem sonrası formu temizle
      setCompanyData({ companyName: '', officeAddress: '', businessActivity: '' })
      setDirectors([{ homeAddress: '', niNumber: '', passportFile: null, brpFile: null }])
      setPscs([])

    } catch (error) {
      alert('Hata oluştu: ' + error.message)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 relative overflow-hidden">
      {/* Mask Image düzeltildi */}
      <div className="absolute inset-0 bg-grid-slate-200 mask-[linear-gradient(to_bottom,white_20%,transparent_100%)]"></div>
      
      {/* Dil Butonu */}
      <div className="absolute top-4 right-4 z-20">
        <button className="justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none border border-slate-200 hover:bg-slate-100 h-10 px-4 py-2 flex items-center gap-2 bg-white/80 backdrop-blur-sm" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <circle cx="12" cy="12" r="10"></circle><line x1="2" x2="22" y1="12" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span>🇬🇧 English</span>
        </button>
      </div>

      <main className="container mx-auto px-4 py-16 sm:py-24 relative z-10">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <img src="https://ataaccountancy.com/wp-content/uploads/2025/08/ata-full-logo.svg" alt="ATA Accountancy Logo" className="mx-auto h-16 w-auto" />
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Company Information Form</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">We will assist you with the establishment of your new venture. To ensure a seamless process, we kindly request the following information from you:</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* --- SECTION 1: COMPANY --- */}
            <div className="rounded-lg border border-slate-200/80 overflow-hidden shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
              <div className="flex flex-col space-y-1.5 p-6 bg-slate-50/80 border-b border-slate-200/80">
                <h3 className="font-semibold tracking-tight flex items-center gap-3 text-2xl text-slate-800">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path>
                  </svg> 
                  For the Company
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="text-sm font-medium leading-none block mb-2" htmlFor="companyName">Company Name</label>
                  <input 
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    id="companyName" 
                    name="companyName" 
                    placeholder="Proposed Name for Your Company"
                    value={companyData.companyName}
                    onChange={handleCompanyChange}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium leading-none block mb-2" htmlFor="officeAddress">Registered Office Address</label>
                  <textarea 
                    className="flex min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    id="officeAddress" 
                    name="officeAddress" 
                    placeholder="Full address of the company"
                    value={companyData.officeAddress}
                    onChange={handleCompanyChange}
                    required
                  ></textarea>
                </div>
                <div>
                  <label className="text-sm font-medium leading-none block mb-2" htmlFor="businessActivity">Business Activity</label>
                  <textarea 
                    className="flex min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    id="businessActivity" 
                    name="businessActivity" 
                    placeholder="Primary Activities/Nature of Business"
                    value={companyData.businessActivity}
                    onChange={handleCompanyChange}
                    required
                  ></textarea>
                </div>
              </div>
            </div>

            {/* --- SECTION 2: DIRECTORS --- */}
            <div className="rounded-lg border border-slate-200/80 overflow-hidden shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
              <div className="flex flex-col space-y-1.5 p-6 bg-slate-50/80 border-b border-slate-200/80">
                <h3 className="font-semibold tracking-tight flex items-center gap-3 text-2xl text-slate-800">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg> 
                  For the Directors
                </h3>
                <p className="text-sm text-slate-500">If Shareholder is Different</p>
              </div>
              
              <div className="p-6 space-y-8">
                {directors.map((dir, index) => (
                  <div key={index} className="p-6 border border-slate-200 rounded-lg bg-white space-y-6 relative shadow-sm">
                    <h4 className="font-semibold text-lg text-slate-700">Director {index + 1}</h4>
                    <div>
                      <label className="text-sm font-medium leading-none block mb-2">Home Address</label>
                      <textarea 
                        className="flex min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Residential Address of Each Director"
                        value={dir.homeAddress}
                        onChange={(e) => handleDirectorChange(index, 'homeAddress', e.target.value)}
                        required
                      ></textarea>
                    </div>
                    <div>
                      <label className="text-sm font-medium leading-none block mb-2">National Insurance (NI) Number</label>
                      <input 
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="NI Number of Each Director"
                        value={dir.niNumber}
                        onChange={(e) => handleDirectorChange(index, 'niNumber', e.target.value)}
                        required
                      />
                    </div>
                    
                    {/* Passport Warning/Upload */}
                    <div className="p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-800 rounded-r-lg">
                      <div className="flex items-start">
                        {/* shrink-0 düzeltildi */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-3 mt-1 shrink-0">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><line x1="10" x2="8" y1="9" y2="9"></line>
                        </svg>
                        <div className="w-full">
                          <p className="font-bold">Passport</p>
                          <p className="text-sm mb-2">Please attach the passport document.</p>
                          <input type="file" accept="image/*,.pdf" onChange={(e) => handleDirectorChange(index, 'passportFile', e.target.files[0])} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"/>
                        </div>
                      </div>
                    </div>

                    {/* BRP Warning/Upload */}
                    <div className="p-4 bg-sky-50 border-l-4 border-sky-400 text-sky-800 rounded-r-lg">
                      <div className="flex items-start">
                        {/* shrink-0 düzeltildi */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-3 mt-1 shrink-0">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><line x1="10" x2="8" y1="9" y2="9"></line>
                        </svg>
                        <div className="w-full">
                          <p className="font-bold">Biometric Residence Permit (BRP)</p>
                          <p className="text-sm mb-2">If applicable, please attach the document.</p>
                          <input type="file" accept="image/*,.pdf" onChange={(e) => handleDirectorChange(index, 'brpFile', e.target.files[0])} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200"/>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button onClick={addDirector} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 h-10 px-4 py-2 w-full gap-2 transition-colors" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" x2="19" y1="8" y2="14"></line><line x1="22" x2="16" y1="11" y2="11"></line>
                  </svg> 
                  Add Another Director
                </button>
              </div>
            </div>

            {/* --- SECTION 3: PSC (Person with Significant Control) --- */}
            <div className="rounded-lg border border-slate-200/80 overflow-hidden shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
              <div className="flex flex-col space-y-1.5 p-6 bg-slate-50/80 border-b border-slate-200/80">
                <h3 className="font-semibold tracking-tight flex items-center gap-3 text-2xl text-slate-800">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
                  </svg> 
                  For Person(s) with Significant Control
                </h3>
                <p className="text-sm text-slate-500">Where Applicable</p>
              </div>
              <div className="p-6 space-y-8">
                <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 rounded-r-lg" role="alert">
                  <p className="font-bold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>
                    </svg> 
                    Note
                  </p>
                  <p> If the person with significant control is not a director, shareholder, or secretary, kindly provide the above information for their records.</p>
                </div>
                
                {/* PSC Listesi */}
                {pscs.map((psc, index) => (
                  <div key={index} className="p-6 border border-slate-200 rounded-lg bg-white space-y-4 relative shadow-sm">
                     <h4 className="font-semibold text-lg text-slate-700">PSC Person {index + 1}</h4>
                     <input 
                       placeholder="Full Name" 
                       className="flex h-10 w-full rounded-md border border-slate-300 px-3" 
                       value={psc.name} 
                       onChange={(e) => handlePscChange(index, 'name', e.target.value)}
                     />
                     <textarea 
                       placeholder="Address" 
                       className="flex min-h-20 w-full rounded-md border border-slate-300 px-3 py-2"
                       value={psc.address}
                       onChange={(e) => handlePscChange(index, 'address', e.target.value)}
                     ></textarea>
                     <input 
                       placeholder="Nature of Control" 
                       className="flex h-10 w-full rounded-md border border-slate-300 px-3"
                       value={psc.natureOfControl}
                       onChange={(e) => handlePscChange(index, 'natureOfControl', e.target.value)}
                     />
                  </div>
                ))}

                <button onClick={addPsc} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 h-10 px-4 py-2 w-full gap-2 transition-colors" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" x2="19" y1="8" y2="14"></line><line x1="22" x2="16" y1="11" y2="11"></line>
                  </svg> 
                  Add Person with Significant Control
                </button>
              </div>
            </div>

            <div className="text-center space-y-6 pt-8">
              <p className="text-slate-600 max-w-3xl mx-auto">Your prompt provision of this information will facilitate the swift processing of your company registration. Once we receive the required details, we will proceed with the necessary steps and keep you informed of the progress.</p>
              <button 
                type="submit" 
                disabled={loading}
                className="inline-flex items-center justify-center font-medium bg-blue-600 text-white hover:bg-blue-700 h-11 rounded-md gap-2 text-lg py-6 px-8 shadow-lg hover:shadow-blue-600/40 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Sending...' : (
                  <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path>
                  </svg>
                  Send Information
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}