/**
 * English web-address names for common remedy tags written in Tamil or Hindi.
 * A tag typed as நெல்லிக்காய் gets the address /tag/amla without the admin typing anything.
 * Tags not listed here use the English name typed after a bar ("name | english-name"),
 * or can be given an address later in Admin > Tags.
 */
const NAMES: Record<string, string> = {
  // Tamil
  "நெல்லிக்காய்": "amla",
  "மஞ்சள்": "turmeric",
  "இஞ்சி": "ginger",
  "சுக்கு": "dry-ginger",
  "தேன்": "honey",
  "துளசி": "tulsi",
  "வேம்பு": "neem",
  "வேப்பிலை": "neem",
  "மிளகு": "pepper",
  "பூண்டு": "garlic",
  "சீரகம்": "cumin",
  "கருஞ்சீரகம்": "black-cumin",
  "வெந்தயம்": "fenugreek",
  "கற்றாழை": "aloe-vera",
  "எலுமிச்சை": "lemon",
  "எலுமிச்சம்பழம்": "lemon",
  "புதினா": "mint",
  "கறிவேப்பிலை": "curry-leaf",
  "வெங்காயம்": "onion",
  "சின்ன வெங்காயம்": "shallot",
  "கொத்தமல்லி": "coriander",
  "ஓமம்": "ajwain",
  "திப்பிலி": "long-pepper",
  "அதிமதுரம்": "licorice",
  "பனங்கற்கண்டு": "palm-candy",
  "கருப்பட்டி": "palm-jaggery",
  "வெல்லம்": "jaggery",
  "பால்": "milk",
  "நெய்": "ghee",
  "தயிர்": "curd",
  "மோர்": "buttermilk",
  "தேங்காய்": "coconut",
  "தேங்காய் எண்ணெய்": "coconut-oil",
  "நல்லெண்ணெய்": "sesame-oil",
  "வாழைப்பழம்": "banana",
  "வாழைப்பூ": "banana-flower",
  "வாழைத்தண்டு": "banana-stem",
  "கிராம்பு": "clove",
  "பட்டை": "cinnamon",
  "ஏலக்காய்": "cardamom",
  "சோம்பு": "fennel",
  "கடுகு": "mustard",
  "மிளகாய்": "chilli",
  "பப்பாளி": "papaya",
  "மாதுளை": "pomegranate",
  "கொய்யா": "guava",
  "நாவல்பழம்": "jamun",
  "புளி": "tamarind",
  "அருகம்புல்": "bermuda-grass",
  "முருங்கை": "moringa",
  "முருங்கைக்கீரை": "moringa-leaves",
  "வல்லாரை": "gotu-kola",
  "வெற்றிலை": "betel-leaf",
  "செம்பருத்தி": "hibiscus",
  "வெட்டிவேர்": "vetiver",
  "சந்தனம்": "sandalwood",
  "நிலவேம்பு": "nilavembu",
  "அஸ்வகந்தா": "ashwagandha",
  "உப்பு": "salt",
  "இந்துப்பு": "rock-salt",
  // Hindi
  "आंवला": "amla",
  "आँवला": "amla",
  "हल्दी": "turmeric",
  "अदरक": "ginger",
  "सोंठ": "dry-ginger",
  "शहद": "honey",
  "तुलसी": "tulsi",
  "नीम": "neem",
  "काली मिर्च": "pepper",
  "लहसुन": "garlic",
  "जीरा": "cumin",
  "मेथी": "fenugreek",
  "एलोवेरा": "aloe-vera",
  "घृतकुमारी": "aloe-vera",
  "नींबू": "lemon",
  "पुदीना": "mint",
  "दालचीनी": "cinnamon",
  "लौंग": "clove",
  "इलायची": "cardamom",
  "सौंफ": "fennel",
  "अजवाइन": "ajwain",
  "दूध": "milk",
  "घी": "ghee",
  "गुड़": "jaggery",
  "अश्वगंधा": "ashwagandha",
};

const clean = (s: string) => s.normalize("NFC").trim().replace(/\s+/g, " ");

/** English address name for a known tag name, or "" when it is not in the list. */
export function englishNameFor(name: string): string {
  const whole = NAMES[clean(name)];
  if (whole) return whole;
  // Several known words, e.g. "இஞ்சி தேன்" -> "ginger-honey".
  const words = clean(name).split(" ");
  if (words.length > 1) {
    const parts = words.map((w) => NAMES[w]);
    if (parts.every(Boolean)) return parts.join("-");
  }
  return "";
}
