/** Brand name shown in the header and footer (Tamil, hard-coded). */
export const BRAND = "அமிழ்தம்";

/** The brand written in English letters, used in every language except Tamil. */
export const BRAND_EN = "Amizhtham";

/** Brand name for the visitor's language: Tamil letters for Tamil, English letters for all other languages. */
export function brandFor(lang: string): string {
  return lang === "ta" ? BRAND : BRAND_EN;
}

/** Site motto shown in the footer: Tamil for Tamil, English for every other language. */
export const MOTTO = "அன்பும் ❤️ ஆக்கமும் 🛠️";
export const MOTTO_EN = "Care ❤️ and Craft 🛠️";

export function mottoFor(lang: string): string {
  return lang === "ta" ? MOTTO : MOTTO_EN;
}
