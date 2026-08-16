import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Admin from './Pages/admin/admin.jsx'
import AdminCards from './Pages/admin/admin-cards.jsx'
import AdminMessages from './Pages/admin/admin-messages.jsx'
import Contact from './Pages/contact/contact.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/cards" element={<AdminCards />} />
                <Route path="/admin/messages" element={<AdminMessages />} />
                <Route path="/contact" element={<Contact />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>,
)