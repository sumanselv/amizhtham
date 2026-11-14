/** Brand name shown in the header and footer (Tamil, hard-coded). */
export const BRAND = "அமிழ்தம்";

/** The brand written in English letters, used in every language except Tamil. */
export const BRAND_EN = "Amizhtham";

/** Brand name for the visitor's language: Tamil letters for Tamil, English letters for all other languages. */
export function brandFor(lang: string): string {
  return lang === "ta" ? BRAND : BRAND_EN;
}

/** Site motto shown in the footer. Always Tamil, in every language. */
export const MOTTO = "அன்பும் ❤️ ஆக்கமும் 🛠️";
