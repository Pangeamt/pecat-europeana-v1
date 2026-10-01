// Tag TYPES for the editor chips, same shape as the SDLXLIFF producer
// (sdlxliff/tagdefs.js buildTagInfo): { key: { name, detail?, equiv? } }.
// Tikal gives, per inline code, `ctype` ("bold", "x-glossary"...), `equiv-text`
// and -- in <ph>/<bpt>/<ept>/<it> -- the original code as text. The name is the
// ctype, else the element name of the original code ("xref" in
// `<xref id="1"/>`), else the equiv-text; with none of them the code has no
// known type and the chip shows the bare placeholder, as before.
const MAX_TAG_DETAIL = 500;

// Okapi names its own inline codes after their position ("run1", "run2" for
// docx runs, "bpt1"...): that is a placeholder, not a type, so it is not shown
// as one (the chip keeps the bare placeholder, as before).
const GENERIC_NAME = /^(run|ph|bpt|ept|it|x|g|b|e)\d*$/i;

/**
 * The chip info of ONE inline code from what the XLIFF says about it: `ctype`,
 * `equiv-text` and, for <ph>/<bpt>/<ept>/<it>, the original code as text.
 * `null` when nothing names it. Shared by the Tikal producer (xmldom nodes,
 * below) and the plain-XLIFF reader (sdlxliff/tagdefs.js, own tree).
 */
export function inlineTagInfo({ ctype = "", equiv = "", code = "" }) {
  const type = String(ctype).replace(/^x-/, "");
  const text = String(code).trim();
  // Okapi numbers the names of its own codes by position ("hyperlink1",
  // "tags2", "run1"): the type is the name without the number.
  const fromCode = /^<\/?([A-Za-z][\w:.-]*)/.exec(text)?.[1]?.replace(/\d+$/, "");
  const name = type || fromCode || equiv;
  // A name taken from the code is generic when it is one of Okapi's own; a
  // declared type ("b" in xlf:b = bold, "x-run1") only when it is one with a number.
  const generic = type ? /\d$/.test(type) && GENERIC_NAME.test(type) : GENERIC_NAME.test(name);
  if (!name || generic) return null;
  return {
    name,
    ...(text ? { detail: text.length > MAX_TAG_DETAIL ? `${text.slice(0, MAX_TAG_DETAIL - 1)}…` : text } : {}),
    ...(equiv && equiv !== name ? { equiv } : {}),
  };
}

export function tagInfoFromCodes(codes) {
  const info = {};
  for (const [key, node] of codes) {
    const entry = inlineTagInfo({
      ctype: node.getAttribute("ctype") || "",
      equiv: node.getAttribute("equiv-text") || "",
      code: node.localName === "g" ? "" : node.textContent || "",
    });
    if (entry) info[key] = entry;
  }
  return Object.keys(info).length ? info : null;
}
