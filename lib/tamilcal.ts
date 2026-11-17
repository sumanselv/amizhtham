/**
 * Tamil calendar month for a date (the Tamil solar months: சித்திரை, வைகாசி ... பங்குனி).
 *
 * A Tamil month starts when the Sun enters the next sidereal sign (Sankranti). By the Tamil Nadu rule, the month
 * starts on the day whose sunset falls after that moment. The Sun's position is computed with a standard low-precision
 * formula (about 15 minutes of accuracy) and the Lahiri ayanamsa. Printed Tamil Nadu panchangams (Vakya) can differ from this
 * by one day around the first or last day of some months, so the day number can be one off on those days.
 */
import { formatDate } from "./slug";

export const TAMIL_MONTHS = ["சித்திரை", "வைகாசி", "ஆனி", "ஆடி", "ஆவணி", "புரட்டாசி", "ஐப்பசி", "கார்த்திகை", "மார்கழி", "தை", "மாசி", "பங்குனி"];

/** The 60 Tamil year names (பிரபவ ... அட்சய), repeating every 60 years. The Tamil year changes on Chithirai 1 (about 14 April). */
export const TAMIL_YEARS = [
  "பிரபவ", "விபவ", "சுக்ல", "பிரமோதூத", "பிரசோற்பத்தி", "ஆங்கீரச", "ஸ்ரீமுக", "பவ", "யுவ", "தாது",
  "ஈஸ்வர", "வெகுதான்ய", "பிரமாதி", "விக்கிரம", "விஷு", "சித்திரபானு", "சுபானு", "தாரண", "பார்த்திப", "விய",
  "சர்வஜித்", "சர்வதாரி", "விரோதி", "விகிர்தி", "கர", "நந்தன", "விஜய", "ஜய", "மன்மத", "துன்முகி",
  "ஹேவிளம்பி", "விளம்பி", "விகாரி", "சார்வரி", "பிலவ", "சுபகிருது", "சோபகிருது", "குரோதி", "விசுவாவசு", "பராபவ",
  "பிலவங்க", "கீலக", "சௌமிய", "சாதாரண", "விரோதிகிருது", "பரிதாபி", "பிரமாதீச", "ஆனந்த", "ராட்சச", "நள",
  "பிங்கள", "காளயுக்தி", "சித்தார்த்தி", "ரௌத்திரி", "துன்மதி", "துந்துபி", "ருத்ரோத்காரி", "ரக்தாட்சி", "குரோதன", "அட்சய",
];

/** Name of the Tamil year that began in April of `startYear` (2026-27 is பராபவ). */
function tamilYearName(startYear: number): string {
  return TAMIL_YEARS[(((startYear - 2026 + 39) % 60) + 60) % 60];
}

const DAY_MS = 86_400_000;
const IST_OFFSET_MS = 5.5 * 3_600_000;
/** Sunset used for the rule: 18:00 IST (about right all year in Tamil Nadu). */
const SUNSET_UTC_HOURS = 12.5;

/** Sidereal (Lahiri) longitude of the Sun in degrees, 0 to 360. */
function siderealSun(utcMs: number): number {
  const jd = utcMs / DAY_MS + 2440587.5;
  const n = jd - 2451545.0;
  const rad = Math.PI / 180;
  const L = 280.46 + 0.9856474 * n;
  const g = (357.528 + 0.9856003 * n) * rad;
  const tropical = L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g);
  const years = n / 365.25;
  const ayanamsa = 23.853 + 0.013969 * years;
  return (((tropical - ayanamsa) % 360) + 360) % 360;
}

/** Sign index (0 = Mesha ... 11 = Meena) at sunset of the given calendar day (UTC midnight of that IST date). */
function signAtSunset(dayStartUtcMs: number): number {
  return Math.floor(siderealSun(dayStartUtcMs + SUNSET_UTC_HOURS * 3_600_000) / 30);
}

/** Tamil month name and day of month for an ISO timestamp (the date is taken in India time). */
export function tamilDate(iso: string): { month: string; day: number; year: string } | null {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const ist = new Date(t + IST_OFFSET_MS);
  const dayStart = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate());
  const sign = signAtSunset(dayStart);
  let day = 1;
  while (day < 33 && signAtSunset(dayStart - day * DAY_MS) === sign) day++;
  // The Tamil year starts at Chithirai 1 (about 14 April): January to mid-April still belong to the year that began the April before.
  const greg = ist.getUTCMonth() + 1; // 1 to 12
  const startYear = greg >= 4 && sign !== 11 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1;
  return { month: TAMIL_MONTHS[sign], day, year: tamilYearName(startYear) };
}

/** Date stamp for a post. On Tamil pages the date is the Tamil month and day only: "கார்த்திகை மாதம் 1ம் தேதி". Other languages show the plain date. */
export function formatPostDate(iso: string, lang: string, locale: string): string {
  const plain = formatDate(iso, locale);
  if (lang !== "ta" || !plain) return plain;
  const t = tamilDate(iso);
  return t ? `${t.month} மாதம் ${t.day}ம் தேதி` : plain;
}
