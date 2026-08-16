import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './admin.css';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';

const API_BASE = 'http://localhost:4000';
const CARDS_URL = `${API_BASE}/api/cards`;
const VERIFY_URL = `${CARDS_URL}/verify-password`;
const MESSAGES_URL = `${API_BASE}/api/messages`;

function AdminMessages() {
    const [password, setPassword] = useState('');
    const [unlocked, setUnlocked] = useState(false);
    const [checkingSaved, setCheckingSaved] = useState(true);

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        restoreSession();
    }, []);

    useEffect(() => {
        if (unlocked) fetchMessages();
    }, [unlocked]);

    async function restoreSession() {
        const saved = localStorage.getItem('admin_password');
        if (!saved) {
            setCheckingSaved(false);
            return;
        }
        const ok = await verifyPassword(saved);
        if (ok) {
            setPassword(saved);
            setUnlocked(true);
        } else {
            localStorage.removeItem('admin_password');
        }
        setCheckingSaved(false);
    }

    async function verifyPassword(candidate) {
        try {
            const res = await fetch(VERIFY_URL, {
                method: 'POST',
                headers: { 'x-admin-password': candidate },
            });
            return res.ok;
        } catch {
            return false;
        }
    }

    async function fetchMessages() {
        try {
            setLoading(true);
            const res = await fetch(MESSAGES_URL, {
                headers: { 'x-admin-password': password },
            });
            if (!res.ok) throw new Error('Failed to load messages');
            setMessages(await res.json());
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Delete this message?')) return;

        try {
            const res = await fetch(`${MESSAGES_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-password': password },
            });
            if (res.status === 401) {
                localStorage.removeItem('admin_password');
                setUnlocked(false);
                throw new Error('Session expired — please unlock again');
            }
            if (!res.ok) throw new Error('Delete failed');

            setMessages((prev) => prev.filter((m) => m.id !== id));
        } catch (err) {
            setError(err.message);
        }
    }

    if (checkingSaved) {
        return (
            <div>
                <Navbar />
                <div className="admin admin-login-page">
                    <p>Checking access…</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (!unlocked) {
        return (
            <div>
                <Navbar />
                <div className="admin admin-login-page">
                    <p>You need to unlock the admin area first.</p>
                    <Link to="/admin" className="admin-nav-button">Go to Admin Login</Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div>
            <Navbar />

            <div className="admin">
                <div className="admin-header">
                    <h1 className="admin-title">Contact Messages</h1>
                    <Link to="/admin" className="admin-nav-button">Back to Admin</Link>
                </div>

                {error && <div className="admin-error">{error}</div>}

                {loading ? (
                    <p>Loading…</p>
                ) : messages.length === 0 ? (
                    <p>No messages yet.</p>
                ) : (
                    <table className="admin-table">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Message</th>
                            <th>Date</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {messages.map((msg) => (
                            <tr key={msg.id}>
                                <td>{msg.name}</td>
                                <td>{msg.email}</td>
                                <td className="admin-desc-cell">{msg.message}</td>
                                <td>{msg.created_at}</td>
                                <td className="admin-row-actions">
                                    <button className="danger" onClick={() => handleDelete(msg.id)}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Footer />
        </div>
    );
}

export default AdminMessages;