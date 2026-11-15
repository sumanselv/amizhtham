/** The Amizhtham logo: a green drop of nectar with a single herb leaf inside. Shared by the header, the browser-tab icon and the share image. */
export const LOGO_PATH = "M12 2.2c-.4 0-.8.2-1 .5C8.6 5.9 5 10.4 5 14.8 5 18.6 8.1 21.8 12 21.8s7-3.2 7-7C19 10.4 15.4 5.9 13 2.7c-.2-.3-.6-.5-1-.5z";

/** Single herb leaf on a short stem drawn in white inside the drop. */
export const LOGO_SPROUT = `<g transform="translate(0 -.3)" fill="#fff">
<path d="M12 19.2c0-2.2.1-3.9.5-5.4" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>
<path d="M12.5 14.6C10.3 12.2 10.6 9.3 13.2 7.6c2.4 1.9 2.6 4.8-.7 7z"/>
</g>`;

export const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
<defs>
<linearGradient id="g" x1="0.15" y1="0" x2="0.85" y2="1"><stop offset="0" stop-color="#63c78f"/><stop offset=".55" stop-color="#2f8a56"/><stop offset="1" stop-color="#1b5232"/></linearGradient>
<radialGradient id="h" cx=".3" cy=".25" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>
<path d="${LOGO_PATH}" fill="url(#g)"/>
<path d="${LOGO_PATH}" fill="url(#h)"/>
${LOGO_SPROUT}
</svg>`;
