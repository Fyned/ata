import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PassportForm from './components/PassportForm'
import AdminDashboard from './components/AdminDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ana Sayfa: Başvuru Formu */}
        <Route path="/" element={<PassportForm />} />
        
        {/* Admin Paneli: Başvuruları Listele */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App