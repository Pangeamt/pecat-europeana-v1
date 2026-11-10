// Trados keyboard shortcuts in the segment editor. Pure, no imports: node:test
// loads it and so does the browser bundle.
//
// Source: RWS, "Shortcuts in Trados Online Editor" and "Editor view > Home
// tab" (Trados Studio 2024), read 2026-11-10. Every Trados shortcut is listed
// here; `supported: false` ones do not apply to PECAT-E (its targets carry no
// formatting, segments come fixed from the file...) and only show a notice.
//
// Matching uses `event.code` for keys whose character changes with the
// keyboard layout (digits with Shift, Space) and `event.key` where the layout
// decides the key (the hyphen is "Slash" on a Spanish keyboard). On Windows
// AltGr arrives as Ctrl+Alt: a Ctrl+Alt shortcut is only taken when the key
// typed is the plain letter, so AltGr+E (€ on a Spanish keyboard) still types.

const letter = (event, l) =>
  event.code === `Key${l.toUpperCase()}` && String(event.key).toLowerCase() === l;
const isHyphen = (event) =>
  ["-", "_"].includes(event.key) || event.code === "Minus" || event.code === "NumpadSubtract";

const mods = (event) => ({
  ctrl: Boolean(event.ctrlKey || event.metaKey),
  alt: Boolean(event.altKey),
  shift: Boolean(event.shiftKey),
});
const only = (event, { ctrl = false, alt = false, shift = false }) => {
  const m = mods(event);
  return m.ctrl === ctrl && m.alt === alt && m.shift === shift;
};

/**
 * Every Trados shortcut: { id, keys (as Trados writes them), group, match,
 * supported, insert? (text it types), editorOnly? (only inside a segment
 * editor) }. `group` and `id` name the i18n keys tus.shortcuts.*.
 */
export const TRADOS_SHORTCUTS = [
  // Translating and reviewing
  { id: "confirmNext", group: "translate", keys: "Ctrl+Enter", supported: true, native: true },
  { id: "confirmNextAny", group: "translate", keys: "Ctrl+Alt+Enter", supported: true, editorOnly: true,
    match: (e) => e.key === "Enter" && only(e, { ctrl: true, alt: true }) },
  { id: "confirmStay", group: "translate", keys: "Ctrl+Alt+Shift+Enter", supported: true, editorOnly: true,
    match: (e) => e.key === "Enter" && only(e, { ctrl: true, alt: true, shift: true }) },
  // Only inside the editor: elsewhere Ctrl+R still reloads the page.
  { id: "reload", group: "translate", keys: "Ctrl+R", supported: true, editorOnly: true,
    match: (e) => letter(e, "r") && only(e, { ctrl: true }) },
  { id: "bold", group: "translate", keys: "Ctrl+B", supported: false, editorOnly: true,
    match: (e) => letter(e, "b") && only(e, { ctrl: true }) },
  { id: "italic", group: "translate", keys: "Ctrl+I", supported: false, editorOnly: true,
    match: (e) => letter(e, "i") && only(e, { ctrl: true }) },
  { id: "underline", group: "translate", keys: "Ctrl+U", supported: false, editorOnly: true,
    match: (e) => letter(e, "u") && only(e, { ctrl: true }) },
  { id: "subscript", group: "translate", keys: "Ctrl+Alt+=", supported: false, editorOnly: true,
    match: (e) => (e.code === "Equal" || e.key === "=") && only(e, { ctrl: true, alt: true }) },
  { id: "superscript", group: "translate", keys: "Ctrl+Shift+=", supported: false, editorOnly: true,
    match: (e) => (e.code === "Equal" || e.code === "BracketRight") && only(e, { ctrl: true, shift: true }) },
  { id: "smallcaps", group: "translate", keys: "Ctrl+Shift+K", supported: false, editorOnly: true,
    match: (e) => e.code === "KeyK" && only(e, { ctrl: true, shift: true }) },
  { id: "clearFormatting", group: "translate", keys: "Ctrl+Space", supported: false, editorOnly: true,
    match: (e) => e.code === "Space" && only(e, { ctrl: true }) },
  { id: "clearAll", group: "translate", keys: "Ctrl+Alt+Space", supported: true,
    match: (e) => e.code === "Space" && e.key === " " && only(e, { ctrl: true, alt: true }) },
  { id: "copySource", group: "translate", keys: "Ctrl+Insert", supported: true, editorOnly: true,
    match: (e) => e.key === "Insert" && only(e, { ctrl: true }) },
  { id: "copySourceAll", group: "translate", keys: "Alt+Shift+Insert", supported: true,
    match: (e) => e.key === "Insert" && only(e, { alt: true, shift: true }) },
  { id: "clearTarget", group: "translate", keys: "Alt+Delete", supported: true, editorOnly: true,
    match: (e) => e.key === "Delete" && only(e, { alt: true }) },
  { id: "clearDrafts", group: "translate", keys: "Alt+Shift+Delete", supported: true,
    match: (e) => e.key === "Delete" && only(e, { alt: true, shift: true }) },
  { id: "changeCase", group: "translate", keys: "Shift+F3", supported: true, editorOnly: true,
    match: (e) => e.key === "F3" && only(e, { shift: true }) },
  { id: "smartMenu", group: "translate", keys: "Ctrl+,", supported: true, native: true },
  { id: "overwrite", group: "translate", keys: "Insert", supported: false, native: true },
  { id: "editSource", group: "translate", keys: "Alt+F2", supported: false,
    match: (e) => e.key === "F2" && only(e, { alt: true }) },
  { id: "verify", group: "translate", keys: "F8", supported: true,
    match: (e) => e.key === "F8" && only(e, {}) },
  { id: "concordance", group: "translate", keys: "F3", supported: true,
    match: (e) => e.key === "F3" && only(e, {}) },
  { id: "concordanceTarget", group: "translate", keys: "Ctrl+Shift+F", supported: true,
    match: (e) => e.code === "KeyF" && only(e, { ctrl: true, shift: true }) },
  // Find and replace (Trados Studio)
  { id: "find", group: "find", keys: "Ctrl+F", supported: true,
    match: (e) => letter(e, "f") && only(e, { ctrl: true }) },
  { id: "replace", group: "find", keys: "Ctrl+H", supported: true,
    match: (e) => letter(e, "h") && only(e, { ctrl: true }) },
  { id: "findNext", group: "find", keys: "F4", supported: true,
    match: (e) => e.key === "F4" && only(e, {}) },
  { id: "findPrev", group: "find", keys: "Shift+F4", supported: true,
    match: (e) => e.key === "F4" && only(e, { shift: true }) },
  // Translation memory
  { id: "tmPrev", group: "tm", keys: "Alt+Page Up", supported: true,
    match: (e) => e.key === "PageUp" && only(e, { alt: true }) },
  { id: "tmNext", group: "tm", keys: "Alt+Page Down", supported: true,
    match: (e) => e.key === "PageDown" && only(e, { alt: true }) },
  { id: "tmApplySelected", group: "tm", keys: "Ctrl+Shift+A", supported: true, editorOnly: true,
    match: (e) => e.code === "KeyA" && only(e, { ctrl: true, shift: true }) },
  { id: "tmApplyN", group: "tm", keys: "Ctrl+1 … Ctrl+9", supported: true, editorOnly: true,
    match: (e) => /^Digit[1-9]$/.test(e.code) && only(e, { ctrl: true }) },
  { id: "tmAdd", group: "tm", keys: "Ctrl+Shift+U", supported: true, editorOnly: true,
    match: (e) => e.code === "KeyU" && only(e, { ctrl: true, shift: true }) },
  // Splitting and locking
  { id: "split", group: "segments", keys: "Ctrl+Alt+I", supported: false,
    match: (e) => letter(e, "i") && only(e, { ctrl: true, alt: true }) },
  { id: "lock", group: "segments", keys: "Ctrl+L", supported: true, native: true },
  { id: "lockSelection", group: "segments", keys: "Ctrl+Shift+L", supported: true,
    match: (e) => e.code === "KeyL" && only(e, { ctrl: true, shift: true }) },
  // Navigation
  { id: "selectAll", group: "navigation", keys: "Ctrl+A", supported: true, native: true },
  { id: "prevSegment", group: "navigation", keys: "Ctrl+↑", supported: true,
    match: (e) => e.key === "ArrowUp" && only(e, { ctrl: true }) },
  { id: "nextSegment", group: "navigation", keys: "Ctrl+↓", supported: true,
    match: (e) => e.key === "ArrowDown" && only(e, { ctrl: true }) },
  { id: "wordKeys", group: "navigation", keys: "Ctrl+← → / Ctrl+Backspace / Ctrl+Delete", supported: true, native: true },
  { id: "firstSegment", group: "navigation", keys: "Ctrl+Home", supported: true,
    match: (e) => e.key === "Home" && only(e, { ctrl: true }) },
  { id: "lastSegment", group: "navigation", keys: "Ctrl+End", supported: true,
    match: (e) => e.key === "End" && only(e, { ctrl: true }) },
  { id: "undoRedo", group: "navigation", keys: "Ctrl+Z / Ctrl+Y", supported: true, native: true },
  { id: "goTo", group: "navigation", keys: "Ctrl+G", supported: true,
    match: (e) => letter(e, "g") && only(e, { ctrl: true }) },
  { id: "ribbon", group: "navigation", keys: "Alt+H / Alt+R / Alt+U / Alt+V", supported: false, native: true },
  // Symbols and special characters
  { id: "emDash", group: "symbols", keys: "Ctrl+Alt+-", supported: true, editorOnly: true, insert: "—",
    match: (e) => isHyphen(e) && only(e, { ctrl: true, alt: true }) },
  { id: "enDash", group: "symbols", keys: "Ctrl+-", supported: true, editorOnly: true, insert: "–",
    match: (e) => isHyphen(e) && only(e, { ctrl: true }) },
  { id: "nbHyphen", group: "symbols", keys: "Ctrl+Shift+-", supported: true, editorOnly: true, insert: "‑",
    match: (e) => isHyphen(e) && only(e, { ctrl: true, shift: true }) },
  { id: "softBreak", group: "symbols", keys: "Shift+Enter", supported: true, native: true },
  { id: "nbsp", group: "symbols", keys: "Ctrl+Shift+Space", supported: true, editorOnly: true, insert: " ",
    match: (e) => e.code === "Space" && only(e, { ctrl: true, shift: true }) },
  { id: "copyright", group: "symbols", keys: "Ctrl+Shift+C / Ctrl+Alt+C", supported: true, editorOnly: true, insert: "©",
    match: (e) =>
      (e.code === "KeyC" && only(e, { ctrl: true, shift: true })) ||
      (letter(e, "c") && only(e, { ctrl: true, alt: true })) },
  { id: "registered", group: "symbols", keys: "Ctrl+Alt+R", supported: true, editorOnly: true, insert: "®",
    match: (e) => letter(e, "r") && only(e, { ctrl: true, alt: true }) },
  { id: "trademark", group: "symbols", keys: "Ctrl+Alt+T", supported: true, editorOnly: true, insert: "™",
    match: (e) => letter(e, "t") && only(e, { ctrl: true, alt: true }) },
  { id: "euro", group: "symbols", keys: "Ctrl+Shift+E", supported: true, editorOnly: true, insert: "€",
    match: (e) => e.code === "KeyE" && only(e, { ctrl: true, shift: true }) },
  { id: "pound", group: "symbols", keys: "Ctrl+Shift+P", supported: true, editorOnly: true, insert: "£",
    match: (e) => e.code === "KeyP" && only(e, { ctrl: true, shift: true }) },
  { id: "quotesGerman", group: "symbols", keys: "Ctrl+Shift+4", supported: true, editorOnly: true, wrap: ["„", "“"],
    match: (e) => e.code === "Digit4" && only(e, { ctrl: true, shift: true }) },
  { id: "quotesEnglish", group: "symbols", keys: "Ctrl+Shift+5", supported: true, editorOnly: true, wrap: ["“", "”"],
    match: (e) => e.code === "Digit5" && only(e, { ctrl: true, shift: true }) },
  { id: "quotesFrench", group: "symbols", keys: "Ctrl+Shift+6", supported: true, editorOnly: true, wrap: ["«", "»"],
    match: (e) => e.code === "Digit6" && only(e, { ctrl: true, shift: true }) },
];

/** The shortcut a keydown stands for (only the ones PECAT-E handles itself), or null. */
export function matchShortcut(event) {
  if (!event || event.isComposing) return null;
  return TRADOS_SHORTCUTS.find((s) => s.match && s.match(event)) ?? null;
}

/** Ctrl+1 … Ctrl+9: which TM match (0-based), or null. */
export const tmIndexOf = (event) => {
  const m = /^Digit([1-9])$/.exec(event?.code ?? "");
  return m ? Number(m[1]) - 1 : null;
};

// ----- Shift+F3: lower → UPPER → Title → lower (as Trados; from pecat-pangeanic)

export function caseMode(s, locale) {
  const lower = s.toLocaleLowerCase(locale);
  const upper = s.toLocaleUpperCase(locale);
  if (s === lower && s !== upper) return "upper";
  if (s === upper && s !== lower) return "title";
  return "lower";
}

export function applyCase(s, mode, locale) {
  if (mode === "upper") return s.toLocaleUpperCase(locale);
  const lower = s.toLocaleLowerCase(locale);
  if (mode === "lower") return lower;
  // An apostrophe does not start a word: "l'été" → "L'été".
  return lower.replace(/(^|[\s\-‐(«"¿¡“„])(\p{L})/gu, (_, sep, c) => sep + c.toLocaleUpperCase(locale));
}

export const cycleCase = (s, locale) => applyCase(s, caseMode(s, locale), locale);

/** Segment number typed in "Go to" → index in `rows`, or -1. `numberOf(row, i)` as the grid shows it. */
export function indexOfSegmentNumber(rows, number, numberOf) {
  const wanted = String(number ?? "").trim();
  if (!wanted) return -1;
  return (rows ?? []).findIndex((row, i) => String(numberOf(row, i + 1)) === wanted);
}
