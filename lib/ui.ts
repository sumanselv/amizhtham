import { cache } from "react";
import { translateMany } from "./i18n";

/** Interface text. Tamil is the source; English is written by hand; other languages are machine-translated and cached. */
const TA = {
  home: "முகப்பு",
  search: "தேடல்",
  language: "மொழி",
  menu: "பட்டியல்",
  heroTitle: "எளிய வீட்டு வைத்தியம், உடனடியாக",
  heroSub: "பாரம்பரிய வைத்தியங்களைப் பொருட்கள் வாரியாகப் பாருங்கள். ஒரு குறிச்சொல்லைத் தொட்டால், அதைப் பயன்படுத்தும் அனைத்துப் பதிவுகளும் தெரியும்.",
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
  disclaimerTitle: "மருத்துவ அறிவிப்பு:",
  disclaimerFooter:
    "இந்தத் தளத்தில் உள்ள வைத்தியங்கள் பாரம்பரிய வீட்டு வைத்தியங்கள்; அவை பொதுவான தகவலுக்காக மட்டுமே பகிரப்படுகின்றன. இவை மருத்துவ ஆலோசனை அல்ல; மருத்துவரின் ஆலோசனைக்கு மாற்றும் அல்ல. நீங்கள் கர்ப்பமாக இருந்தால், மருந்துகள் உட்கொண்டால் அல்லது உடல்நலப் பிரச்சினை இருந்தால், முதலில் தகுந்த நிபுணரிடம் ஆலோசியுங்கள்.",
  disclaimerPost:
    "இந்த வைத்தியம் பொதுவான தகவலுக்காக மட்டுமே பகிரப்படுகிறது; இது மருத்துவ ஆலோசனை அல்ல. நீங்கள் கர்ப்பமாக இருந்தால், மருந்துகள் உட்கொண்டால் அல்லது உடல்நலப் பிரச்சினை இருந்தால், மருத்துவரிடம் கேளுங்கள்.",
  allRemedies: "அனைத்து வைத்தியங்கள்",
  allRemediesSub: "ஒரு பொருளைத் தேர்ந்தெடுத்தால், அதைப் பயன்படுத்தும் அனைத்துப் பதிவுகளும் தெரியும்.",
  noTags: "இன்னும் குறிச்சொற்கள் இல்லை.",
  contact: "தொடர்பு",
  contactSub: "கேள்வி, கருத்து அல்லது பரிந்துரை இருந்தால் எங்களுக்கு எழுதுங்கள்.",
  yourName: "உங்கள் பெயர்",
  yourEmail: "மின்னஞ்சல் (பதில் வேண்டுமெனில்)",
  yourMessage: "உங்கள் செய்தி",
  send: "அனுப்பு",
  contactSent: "நன்றி! உங்கள் செய்தி கிடைத்தது.",
  contactError: "செய்தியை அனுப்ப முடியவில்லை. பெயர் மற்றும் செய்தியை நிரப்பி, மீண்டும் முயலுங்கள்.",
  siteTitle: "அமிழ்தம் - எளிய வீட்டு வைத்தியம்",
  siteDescription: "எளிய பொருட்களுடன் பாரம்பரிய வீட்டு வைத்தியங்கள். நெல்லிக்காய், மஞ்சள், இஞ்சி போன்ற பொருட்கள் வாரியாகப் பாருங்கள்.",
};

export type UiKey = keyof typeof TA;
export type Ui = Record<UiKey, string>;

const EN: Ui = {
  home: "Home",
  search: "Search",
  language: "Language",
  menu: "Menu",
  heroTitle: "Simple home remedies, right away",
  heroSub: "Browse traditional remedies by ingredient. Tap a tag to see every post that uses it.",
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
  disclaimerTitle: "Medical notice:",
  disclaimerFooter:
    "The remedies on this site are traditional home remedies, shared for general information only. They are not medical advice and do not replace a doctor's advice. If you are pregnant, take medication or have a health condition, please consult a qualified professional first.",
  disclaimerPost:
    "This remedy is shared for general information only and is not medical advice. If you are pregnant, take medication or have a health condition, ask your doctor.",
  allRemedies: "All remedies",
  allRemediesSub: "Choose an ingredient to see every post that uses it.",
  noTags: "No tags yet.",
  contact: "Contact",
  contactSub: "Have a question, feedback or a suggestion? Write to us.",
  yourName: "Your name",
  yourEmail: "Email (if you want a reply)",
  yourMessage: "Your message",
  send: "Send",
  contactSent: "Thank you! We received your message.",
  contactError: "Could not send your message. Please fill in your name and message and try again.",
  siteTitle: "Amizhtham - simple home remedies",
  siteDescription: "Traditional home remedies made with simple ingredients. Browse by ingredient such as amla, turmeric and ginger.",
};

/** Interface text in the visitor's language (one batched cache lookup per request). */
export const getUi = cache(async (lang: string): Promise<Ui> => {
  if (lang === "ta") return TA;
  if (lang === "en") return EN;
  const map = await translateMany(lang, Object.values(TA));
  return Object.fromEntries(Object.entries(TA).map(([k, v]) => [k, map.get(v) ?? EN[k as UiKey]])) as Ui;
});
