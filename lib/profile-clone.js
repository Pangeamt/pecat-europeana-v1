// Name of a cloned profile (pure, no imports: node:test loads it):
// "<name> (copy)", then "<name> (copy 2)", "(copy 3)"... when taken. `word` is
// "copy" / "copia" in the user's language. Cloning a clone numbers from the
// ORIGINAL's name instead of stacking suffixes ("X (copy) (copy)").

const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function cloneName(name, existingNames = [], word = "copy") {
  const trimmed = String(name ?? "").trim();
  const suffix = new RegExp(`\\s*\\(${escapeRe(word)}(?: \\d+)?\\)\\s*$`, "i");
  const base = trimmed.replace(suffix, "") || trimmed;
  const taken = new Set(
    (existingNames ?? []).map((item) => String(item ?? "").trim().toLowerCase()),
  );
  for (let n = 1; ; n += 1) {
    const candidate = `${base} (${word}${n === 1 ? "" : ` ${n}`})`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}

/** The wizard's starting values for a clone: everything the original has. */
export function cloneFormValues(profile, existingNames, word) {
  return {
    name: cloneName(profile?.name, existingNames, word),
    description: profile?.description ?? undefined,
    domain: profile?.domain ?? undefined,
    formality: profile?.formality ?? "",
    instructions: profile?.instructions ?? undefined,
    llmPreset: profile?.llmPreset ?? undefined,
    tmIds: (profile?.tms ?? []).map((tm) => tm.id),
    glossaryIds: (profile?.glossaries ?? []).map((glossary) => glossary.id),
  };
}
