import { cache } from "react";
import { translateMany } from "./i18n";

/** Interface text. Tamil is the source; English is written by hand; other languages are machine-translated and cached. */
const TA = {
  home: "முகப்பு",
  search: "தேடல்",
  language: "மொழி",
  searchResults: "தேடல் முடிவுகள்",
  browseByRemedy: "வைத்தியம் வாரியாகப் பார்க்க",
  noResults: "உங்கள் தேடலுக்குப் பொருத்தமான வைத்தியங்கள் இல்லை.",
  noPosts: "இன்னும் பதிவுகள் எதுவும் இல்லை.",
  noTagPosts: "இந்த வைத்தியத்திற்கு இன்னும் பதிவுகள் இல்லை.",
  postsUsingThis: "இதைப் பயன்படுத்தும் பதிவுகள்",
  tagSuffix: "வீட்டு வைத்தியங்கள்",
  notFound: "வைத்தியம் கிடைக்கவில்லை",
  related: "நீங்கள் விரும்பக்கூடிய மேலும் வைத்தியங்கள்",
  newer: "← புதியவை",
  older: "பழையவை →",
  page: "பக்கம்",
  pagesLabel: "பக்கங்கள்",
  disclaimerFooter: "பாரம்பரிய வீட்டு வைத்தியங்கள், பொதுவான தகவலுக்காக மட்டும். மருத்துவ ஆலோசனைக்கு மாற்று அல்ல.",
  allRemedies: "அனைத்து வைத்தியங்கள்",
  allRemediesSub: "ஒரு பொருளைத் தேர்ந்தெடுத்தால், அதைப் பயன்படுத்தும் அனைத்துப் பதிவுகளும் தெரியும்.",
  noTags: "இன்னும் குறிச்சொற்கள் இல்லை.",
  contact: "தொடர்பு",
  herbs: "மூலிகைகள்",
  herbsSub: "ஒரு மூலிகையைத் தேர்ந்தெடுத்தால், அதைப் பற்றிய அனைத்து வைத்தியங்களும் தெரியும்.",
  causes: "காரணங்கள்",
  causesSub: "உங்கள் பிரச்சினையைத் தேர்ந்தெடுத்தால், அதற்கான அனைத்து வைத்தியங்களும் தெரியும்.",
  noEntries: "இன்னும் எதுவும் சேர்க்கப்படவில்லை.",
  poemPage: "பக்கம்",
  books: "நூல்கள்",
  booksSub: "ஒரு நூலைத் தேர்ந்தெடுத்தால், அதிலிருந்து எடுத்த அனைத்து வைத்தியங்களும் தெரியும்.",
  openBook: "PDF படிக்க",
  contactSub: "கேள்வி, கருத்து அல்லது பரிந்துரை இருந்தால் எங்களுக்கு எழுதுங்கள்.",
  yourName: "உங்கள் பெயர்",
  yourEmail: "மின்னஞ்சல் (பதில் வேண்டுமெனில்)",
  yourMessage: "உங்கள் செய்தி",
  send: "அனுப்பு",
  contactSent: "நன்றி! உங்கள் செய்தி கிடைத்தது.",
  contactError: "செய்தியை அனுப்ப முடியவில்லை. பெயர் மற்றும் செய்தியை நிரப்பி, மீண்டும் முயலுங்கள்.",
  author: "ஆசிரியர்",
  book: "நூல்",
  booksByAuthor: "இந்த ஆசிரியரின் நூல்கள்",
  allBooks: "அனைத்து நூல்களும் →",
  noBooks: "இந்த ஆசிரியருக்கு இன்னும் நூல்கள் இல்லை.",
  postsCount: "பதிவுகள்",
  siteDescription: "எளிய பொருட்களுடன் பாரம்பரிய வீட்டு வைத்தியங்கள். நெல்லிக்காய், மஞ்சள், இஞ்சி போன்ற பொருட்கள் வாரியாகப் பாருங்கள்.",
};

export type UiKey = keyof typeof TA;
export type Ui = Record<UiKey, string>;

const EN: Ui = {
  home: "Home",
  search: "Search",
  language: "Language",
  searchResults: "Search results",
  browseByRemedy: "Browse by remedy",
  noResults: "No remedies match your search.",
  noPosts: "No posts yet.",
  noTagPosts: "No posts for this remedy yet.",
  postsUsingThis: "Posts that use this",
  tagSuffix: "home remedies",
  notFound: "Remedy not found",
  related: "More remedies you may like",
  newer: "← Newer",
  older: "Older →",
  page: "Page",
  pagesLabel: "Pages",
  disclaimerFooter: "Traditional home remedies, shared for general information only. Not a substitute for medical advice.",
  allRemedies: "All remedies",
  allRemediesSub: "Choose an ingredient to see every post that uses it.",
  noTags: "No tags yet.",
  contact: "Contact",
  herbs: "Herbs",
  herbsSub: "Choose a herb to see every remedy that uses it.",
  causes: "Causes",
  causesSub: "Choose your problem to see every remedy for it.",
  noEntries: "Nothing added yet.",
  poemPage: "Page",
  books: "Books",
  booksSub: "Choose a book to see every remedy taken from it.",
  openBook: "Read the PDF",
  contactSub: "Have a question, feedback or a suggestion? Write to us.",
  yourName: "Your name",
  yourEmail: "Email (if you want a reply)",
  yourMessage: "Your message",
  send: "Send",
  contactSent: "Thank you! We received your message.",
  contactError: "Could not send your message. Please fill in your name and message and try again.",
  author: "Author",
  book: "Book",
  booksByAuthor: "Books by this author",
  allBooks: "All books →",
  noBooks: "No books for this author yet.",
  postsCount: "posts",
  siteDescription: "Traditional home remedies made with simple ingredients. Browse by ingredient such as amla, turmeric and ginger.",
};

/** Interface text in the visitor's language (one batched cache lookup per request). */
export const getUi = cache(async (lang: string): Promise<Ui> => {
  if (lang === "ta") return TA;
  if (lang === "en") return EN;
  // Translate from the hand-written English (more reliable than Tamil as a source for other languages).
  const map = await translateMany(lang, Object.values(EN));
  return Object.fromEntries(Object.entries(EN).map(([k, v]) => [k, map.get(v) ?? v])) as Ui;
});
