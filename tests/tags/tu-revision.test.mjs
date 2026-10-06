// Historial de ediciones de un segmento: una fila por accion guardada, con el texto, el
// estado y la nota MTQE de antes y de despues. node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  HISTORY_PREVIEW,
  buildTuRevisions,
  revisionActionOf,
  visibleRevisions,
} from "../../lib/tu-revision.js";

const before = {
  id: "tu1",
  documentId: "doc1",
  translatedLiteral: "Synthèse",
  reviewLiteral: null,
  Status: "TRANSLATED_MT",
  mtqeV2Score: 0.98,
};
const by = { id: "u1", name: "Angela" };

test("historial: confirmar guarda texto, estado y MTQE de antes y de despues", () => {
  const after = { ...before, reviewLiteral: "Synthèse EDITADO", Status: "EDITED", mtqeV2Score: 0.71 };
  assert.deepEqual(buildTuRevisions({ action: "approve", before, after, by }), [
    {
      tuId: "tu1",
      documentId: "doc1",
      action: "approve",
      textBefore: "Synthèse",
      textAfter: "Synthèse EDITADO",
      statusBefore: "TRANSLATED_MT",
      statusAfter: "EDITED",
      mtqeBefore: 0.98,
      mtqeAfter: 0.71,
      propagatedFromId: null,
      byUserId: "u1",
      byName: "Angela",
    },
  ]);
});

test("historial: el texto de antes es el revisado si lo habia, y si no la traduccion", () => {
  const edited = { ...before, reviewLiteral: "Primera", Status: "EDITED" };
  const [row] = buildTuRevisions({
    action: "save_draft",
    before: edited,
    after: { ...edited, reviewLiteral: "Segunda" },
    by,
  });
  assert.equal(row.textBefore, "Primera");
  assert.equal(row.textAfter, "Segunda");
});

test("historial: una confirmacion que se propaga deja una fila en cada segmento alcanzado", () => {
  const siblingBefore = { ...before, id: "tu2" };
  const rows = buildTuRevisions({
    action: "approve",
    before,
    after: { ...before, Status: "ACCEPTED" },
    siblings: [{ before: siblingBefore, after: { ...siblingBefore, Status: "ACCEPTED" } }],
    by,
  });
  assert.deepEqual(rows.map((r) => [r.tuId, r.propagatedFromId, r.statusBefore, r.statusAfter]), [
    ["tu1", null, "TRANSLATED_MT", "ACCEPTED"],
    ["tu2", "tu1", "TRANSLATED_MT", "ACCEPTED"],
  ]);
});

test("historial: bloquear no cambia el texto; sin nota MTQE queda en null; enlace anonimo sin usuario", () => {
  const noScore = { ...before, mtqeV2Score: null };
  const [row] = buildTuRevisions({
    action: "lock",
    before: noScore,
    after: { ...noScore, block: true },
    by: { id: null, name: "Translator link" },
  });
  assert.equal(row.textBefore, row.textAfter);
  assert.equal(row.mtqeBefore, null);
  assert.equal(row.mtqeAfter, null);
  assert.equal(row.byUserId, null);
  assert.equal(row.byName, "Translator link");
  assert.deepEqual(buildTuRevisions({ action: "approve", before, after: null, by }), []);
});

test("historial: un deshacer o un rehacer queda registrado como tal, no como un cambio cualquiera", () => {
  assert.equal(revisionActionOf({ action: "restore", direction: "undo" }), "undo");
  assert.equal(revisionActionOf({ action: "restore", direction: "redo" }), "redo");
  assert.equal(revisionActionOf({ action: "restore" }), "undo", "sin direccion: deshacer");
  assert.equal(revisionActionOf({ action: "approve" }), "approve");
  const [row] = buildTuRevisions({
    action: revisionActionOf({ action: "restore", direction: "undo" }),
    before: { ...before, reviewLiteral: "Synthèse EDITADO", Status: "EDITED" },
    after: before,
    by,
  });
  assert.equal(row.action, "undo");
  assert.equal(row.textBefore, "Synthèse EDITADO");
  assert.equal(row.textAfter, "Synthèse");
  assert.equal(row.statusAfter, "TRANSLATED_MT");
});

test("historial: el panel ensena las 5 ultimas y con 'ver mas' todas", () => {
  const many = Array.from({ length: 12 }, (_, i) => ({ id: `r${i}` }));
  assert.equal(HISTORY_PREVIEW, 5);
  assert.deepEqual(visibleRevisions(many, false).map((r) => r.id), ["r0", "r1", "r2", "r3", "r4"]);
  assert.equal(visibleRevisions(many, true).length, 12);
  assert.equal(visibleRevisions(many.slice(0, 3), false).length, 3);
  assert.deepEqual(visibleRevisions(null, false), []);
});
