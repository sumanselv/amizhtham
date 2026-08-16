import { useState } from "react";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                🪴அமிழ்தம்
            </div>

            <button
                className="menu-toggle"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle navigation"
            >
                {menuOpen ? "✕" : "☰"}
            </button>

            <ul className={`navbar-links ${menuOpen ? "open" : ""}`}>
                <li><a href="/" onClick={() => setMenuOpen(false)}>முகப்பு</a></li>
                <li><a href="/contact" onClick={() => setMenuOpen(false)}>மின்னஞ்சல்</a></li>
            </ul>
        </nav>
    );
}