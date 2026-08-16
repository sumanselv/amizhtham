import { useState } from 'react';
import './contact.css';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';

const MESSAGES_URL = 'http://localhost:4000/api/messages';

const emptyForm = { name: '', email: '', message: '' };

function Contact() {
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'sent'
    const [submitError, setSubmitError] = useState(null);

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // clear that field's error as soon as the person starts fixing it
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    function validate() {
        const next = {};

        if (!form.name.trim()) {
            next.name = 'Name is required';
        }

        if (!form.email.trim()) {
            next.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            next.email = 'Enter a valid email address';
        }

        if (!form.message.trim()) {
            next.message = 'Message is required';
        } else if (form.message.trim().length < 10) {
            next.message = 'Message should be at least 10 characters';
        }

        return next;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setStatus('sending');
        setSubmitError(null);

        try {
            const res = await fetch(MESSAGES_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Failed to send message (status ${res.status})`);
            }

            setStatus('sent');
            setForm(emptyForm);
        } catch (err) {
            setSubmitError(err.message);
            setStatus('idle');
        }
    }

    return (
        <div>
            <Navbar />

            <div className="contact-page">
                <div className="contact-intro">
                    <h1 className="contact-title">மின்னஞ்சல் அழைப்பு</h1>
                    <p className="contact-subtitle">
                        மின்னஞ்சல் மூலம் தொடா்புகொள்ள...
                    </p>
                </div>

                {status === 'sent' ? (
                    <div className="contact-success">
                        <p>நன்றி, தாங்கள் குறுஞ்செய்தி பெறப்பட்டது. விரைவில் உங்களைத் தொடர்புகொள்வோம்.</p>
                        <button onClick={() => setStatus('idle')}>மற்றொரு குறுஞ்செய்தி அனுப்ப...</button>
                    </div>
                ) : (
                    <form className="contact-form" onSubmit={handleSubmit} noValidate>
                        {submitError && <span className="contact-error">{submitError}</span>}
                        <label>
                            பெயர்
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="தாங்கள் பெயர்"
                            />
                            {errors.name && <span className="contact-error">{errors.name}</span>}
                        </label>

                        <label>
                            மின்னஞ்சல்
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                            />
                            {errors.email && <span className="contact-error">{errors.email}</span>}
                        </label>

                        <label>
                            குறுஞ்செய்தி
                            <textarea
                                name="message"
                                value={form.message}
                                onChange={handleChange}
                                rows={6}
                                placeholder="தாங்களுக்கு எவ்வாறு உதவலாம் ?"
                            />
                            {errors.message && <span className="contact-error">{errors.message}</span>}
                        </label>

                        <button type="submit" disabled={status === 'sending'}>
                            {status === 'sending' ? 'சமர்ப்பிக்கப்படுகிறது…' : 'சமர்ப்பிக்கவும்'}
                        </button>
                    </form>
                )}
            </div>

            <Footer />
        </div>
    );
}

export default Contact;