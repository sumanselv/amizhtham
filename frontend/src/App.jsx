import { useEffect, useState } from 'react';
import './App.css';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';

function App() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedIndex, setExpandedIndex] = useState(null); // index into cards[], or null

    const expandedCard = expandedIndex !== null ? cards[expandedIndex] : null;
    const hasPrev = expandedIndex !== null && expandedIndex > 0;
    const hasNext = expandedIndex !== null && expandedIndex < cards.length - 1;

    function showPrev() {
        setExpandedIndex((i) => (i > 0 ? i - 1 : i));
    }

    function showNext() {
        setExpandedIndex((i) => (i < cards.length - 1 ? i + 1 : i));
    }

    useEffect(() => {
        fetch('http://localhost:4000/api/cards')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load cards');
                return res.json();
            })
            .then(setCards)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    // Close on Escape, navigate with arrow keys, from anywhere on the page.
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape') setExpandedIndex(null);
            if (e.key === 'ArrowLeft') showPrev();
            if (e.key === 'ArrowRight') showNext();
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cards]);

    // While expanded, stop the page behind the modal from scrolling.
    useEffect(() => {
        document.body.style.overflow = expandedIndex !== null ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [expandedIndex]);

    function timeAgo(date) {
        if (!date) return "";

        const utcDate = new Date(
            String(date).replace(" ", "T") + "Z"
        );

        const diff = Date.now() - utcDate.getTime();
        const seconds = Math.floor(diff / 1000);

        if (seconds < 10) return "just now";
        if (seconds < 60) return `${seconds}s ago`;

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;

        const months = Math.floor(days / 30);
        if (months < 12) return `${months}mo ago`;

        const years = Math.floor(days / 365);
        return `${years}y ago`;
    }

    return (
        <div>
            <Navbar />

            <div className="cards-grid">
                {loading && <p className="cards-status">Loading…</p>}
                {error && <p className="cards-status">{error}</p>}
                {!loading && !error && cards.length === 0 && (
                    <p className="cards-status">No cards yet.</p>
                )}

                {cards.map((card, index) => (
                    <div
                        className="card"
                        key={card.id}
                        onClick={() => setExpandedIndex(index)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setExpandedIndex(index)}
                    >
                        <img className="card-img" src={card.image_url} alt={card.title} />
                        <div className="card-body">
                            <h3 className="card-title">{card.title}</h3>
                            <p className="card-desc">
                                {card.description.length > 150
                                    ? card.description.slice(0, 130) + "..."
                                    : card.description}
                            </p>
                        </div>
                        <p className="card-date">
                            {timeAgo(card.created_at)}
                        </p>
                    </div>
                ))}
            </div>

            {expandedCard && (
                <div className="card-modal-backdrop" onClick={() => setExpandedIndex(null)}>
                    {hasPrev && (
                        <button
                            className="card-modal-arrow card-modal-arrow-left"
                            onClick={(e) => {
                                e.stopPropagation();
                                showPrev();
                            }}
                            aria-label="Previous"
                        >
                            &#8249;
                        </button>
                    )}

                    <div className="card-modal" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="card-modal-close"
                            onClick={() => setExpandedIndex(null)}
                            aria-label="Close"
                        >
                            &times;
                        </button>

                        <img
                            className="card-modal-img"
                            src={expandedCard.image_url}
                            alt={expandedCard.title}
                        />

                        <div className="card-modal-body">
                            <h2 className="card-modal-title">{expandedCard.title}</h2>
                            <p className="card-modal-date">{timeAgo(expandedCard.created_at)}</p>
                            <p className="card-modal-desc">{expandedCard.description}</p>
                            {expandedCard.body && (
                                <p className="card-modal-text">{expandedCard.body}</p>
                            )}
                        </div>
                    </div>

                    {hasNext && (
                        <button
                            className="card-modal-arrow card-modal-arrow-right"
                            onClick={(e) => {
                                e.stopPropagation();
                                showNext();
                            }}
                            aria-label="Next"
                        >
                            &#8250;
                        </button>
                    )}
                </div>
            )}

            <Footer />
        </div>
    );
}

export default App;