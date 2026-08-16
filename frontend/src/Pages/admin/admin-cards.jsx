import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './admin.css';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';

const API_BASE = 'http://localhost:4000';
const CARDS_URL = `${API_BASE}/api/cards`;
const VERIFY_URL = `${CARDS_URL}/verify-password`;

function AdminCards() {
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [unlocked, setUnlocked] = useState(false);
    const [checkingSaved, setCheckingSaved] = useState(true);

    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        restoreSession();
    }, []);

    useEffect(() => {
        if (unlocked) fetchCards();
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

    async function fetchCards() {
        try {
            setLoading(true);
            const res = await fetch(CARDS_URL);
            if (!res.ok) throw new Error('Failed to load cards');
            setCards(await res.json());
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Delete this card?')) return;

        try {
            const res = await fetch(`${CARDS_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-password': password },
            });
            if (res.status === 401) {
                localStorage.removeItem('admin_password');
                setUnlocked(false);
                throw new Error('Session expired — please unlock again');
            }
            if (!res.ok) throw new Error('Delete failed');

            setCards((prev) => prev.filter((c) => c.id !== id));
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
                    <h1 className="admin-title">Existing Cards</h1>
                    <Link to="/admin" className="admin-nav-button">Back to Admin</Link>
                </div>

                {error && <div className="admin-error">{error}</div>}

                {loading ? (
                    <p>Loading…</p>
                ) : cards.length === 0 ? (
                    <p>No cards yet.</p>
                ) : (
                    <table className="admin-table">
                        <thead>
                        <tr>
                            <th>Image</th>
                            <th>Title</th>
                            <th>Description</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {cards.map((card) => (
                            <tr key={card.id}>
                                <td>
                                    <img src={card.image_url} alt={card.title} className="admin-thumb" />
                                </td>
                                <td>{card.title}</td>
                                <td className="admin-desc-cell">{card.description}</td>
                                <td className="admin-row-actions">
                                    <button onClick={() => navigate(`/admin?edit=${card.id}`)}>Edit</button>
                                    <button className="danger" onClick={() => handleDelete(card.id)}>
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

export default AdminCards;