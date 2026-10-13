// How long a profile's "instructions" may be (pure, no imports: node:test
// loads it).
//
// The limit is PROFILE_INSTRUCTIONS_MAX in the .env, in characters. It is read
// when the server starts: changing it takes a restart of the container, not a
// build. Unset, or anything that is not a whole number above zero, means the
// default.
//
// The text is kept in a MySQL TEXT column (65,535 BYTES) here and in its DAAIT
// mirror, so the limit never goes past that. Accents and non-Latin scripts take
// more than a byte per character: a text within the limit may still not fit,
// and fitsInstructionsColumn says so before the database does.

export const DEFAULT_INSTRUCTIONS_MAX = 5000;
export const INSTRUCTIONS_COLUMN_BYTES = 65535;

/** The limit in characters for the raw value of PROFILE_INSTRUCTIONS_MAX. */
export function instructionsMax(raw) {
  const text = String(raw ?? "").trim();
  if (!/^\d+$/.test(text)) return DEFAULT_INSTRUCTIONS_MAX;
  const value = Number(text);
  if (value < 1) return DEFAULT_INSTRUCTIONS_MAX;
  return Math.min(value, INSTRUCTIONS_COLUMN_BYTES);
}

/** Whether `text` fits in the column that stores the instructions. */
export const fitsInstructionsColumn = (text) =>
  new TextEncoder().encode(String(text ?? "")).length <= INSTRUCTIONS_COLUMN_BYTES;
