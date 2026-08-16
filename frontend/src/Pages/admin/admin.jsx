import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './admin.css';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';

const API_BASE = 'http://localhost:4000';
const CARDS_URL = `${API_BASE}/api/cards`;
const VERIFY_URL = `${CARDS_URL}/verify-password`;
const UPLOAD_URL = `${API_BASE}/api/upload`;

const emptyForm = { title: '', description: '', body: '', image_url: '' };

function Admin() {
    const [searchParams] = useSearchParams();

    // ---- auth state ----
    const [password, setPassword] = useState('');
    const [unlocked, setUnlocked] = useState(false);
    const [checkingSaved, setCheckingSaved] = useState(true);
    const [passwordInput, setPasswordInput] = useState('');
    const [unlockError, setUnlockError] = useState(null);
    const [unlocking, setUnlocking] = useState(false);

    // ---- form state ----
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    useEffect(() => {
        restoreSession();
    }, []);

    // If the URL has ?edit=<id> (arrived here from the cards list "Edit"
    // button), load that card into the form once we're unlocked.
    useEffect(() => {
        const editId = searchParams.get('edit');
        if (unlocked && editId) {
            loadCardForEdit(editId);
        }
    }, [unlocked, searchParams]);

    async function loadCardForEdit(id) {
        try {
            const res = await fetch(`${CARDS_URL}/${id}`);
            if (!res.ok) throw new Error('Could not load that card');
            const card = await res.json();
            setEditingId(card.id);
            setForm({
                title: card.title,
                description: card.description,
                body: card.body,
                image_url: card.image_url,
            });
        } catch (err) {
            setError(err.message);
        }
    }

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

    async function handleUnlock(e) {
        e.preventDefault();
        setUnlockError(null);
        setUnlocking(true);

        const ok = await verifyPassword(passwordInput);

        if (ok) {
            localStorage.setItem('admin_password', passwordInput);
            setPassword(passwordInput);
            setUnlocked(true);
            setPasswordInput('');
        } else {
            setUnlockError('Incorrect password — please try again.');
        }

        setUnlocking(false);
    }

    function handleLock() {
        localStorage.removeItem('admin_password');
        setPassword('');
        setUnlocked(false);
    }

    function authHeaders() {
        return {
            'Content-Type': 'application/json',
            'x-admin-password': password,
        };
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    function cancelEdit() {
        setEditingId(null);
        setForm(emptyForm);
        setUploadError(null);
    }

    async function handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        setUploadError(null);
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const res = await fetch(UPLOAD_URL, {
                method: 'POST',
                headers: { 'x-admin-password': password },
                body: formData,
            });

            if (res.status === 401) {
                handleLock();
                throw new Error('Session expired — please unlock again');
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');

            setForm((prev) => ({ ...prev, image_url: data.url }));
        } catch (err) {
            setUploadError(err.message);
        } finally {
            setUploading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSuccess(null);

        if (!form.title || !form.description || !form.image_url) {
            setError('All fields are required');
            return;
        }

        const isEditing = editingId !== null;
        const url = isEditing ? `${CARDS_URL}/${editingId}` : CARDS_URL;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });

            if (res.status === 401) {
                handleLock();
                throw new Error('Session expired — please unlock again');
            }
            if (!res.ok) throw new Error('Save failed');

            setSuccess(isEditing ? 'Card updated.' : 'Card created.');
            cancelEdit();
            setError(null);
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
                    <form className="admin-form admin-login-form" onSubmit={handleUnlock}>
                        <h2>Admin Access</h2>
                        {unlockError && <div className="admin-error">{unlockError}</div>}
                        <label>
                            Password
                            <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                autoFocus
                            />
                        </label>
                        <div className="admin-form-actions">
                            <button type="submit" disabled={unlocking}>
                                {unlocking ? 'Checking…' : 'Unlock'}
                            </button>
                        </div>
                    </form>
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
                    <h1 className="admin-title">Card Admin</h1>
                    <button className="admin-logout" onClick={handleLock}>Lock</button>
                </div>

                {error && <div className="admin-error">{error}</div>}
                {success && <div className="admin-success">{success}</div>}

                <form className="admin-form" onSubmit={handleSubmit}>
                    <h2>{editingId !== null ? 'Edit Card' : 'New Card'}</h2>

                    <label>
                        Title
                        <input name="title" value={form.title} onChange={handleChange} />
                    </label>

                    <label>
                        Description
                        <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
                    </label>

                    <label>
                        Body (full content)
                        <textarea name="body" value={form.body} onChange={handleChange} rows={6} />
                    </label>

                    <label>
                        Image
                        <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                    </label>

                    {uploading && <p className="admin-upload-status">Uploading…</p>}
                    {uploadError && <div className="admin-error">{uploadError}</div>}

                    {form.image_url && (
                        <img src={form.image_url} alt="Preview" className="admin-image-preview" />
                    )}

                    <div className="admin-form-actions">
                        <button type="submit" disabled={uploading}>
                            {editingId !== null ? 'Update' : 'Create'}
                        </button>
                        {editingId !== null && (
                            <button type="button" className="secondary" onClick={cancelEdit}>Cancel</button>
                        )}
                    </div>
                </form>

                <div className="admin-nav-buttons">
                    <Link to="/admin/cards" className="admin-nav-button">
                        Existing Cards
                    </Link>
                    <Link to="/admin/messages" className="admin-nav-button">
                        Contact Messages
                    </Link>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default Admin;