// Deshacer / rehacer del editor de segmentos: lo escrito (un historial por segmento, que
// sobrevive a salir del segmento) y las acciones guardadas (confirmar, rechazar, bloquear),
// que se deshacen restaurando en el servidor cada segmento tocado.
// node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_HISTORY,
  actionEntry,
  emptyActionHistory,
  recordAction,
  recordText,
  redoAction,
  redoText,
  snapshotOf,
  undoAction,
  undoText,
} from "../../lib/edit-history.js";

test("texto: cada pausa al escribir es un paso; una rafaga es uno solo", () => {
  let h = recordText(undefined, "Synthèse", 1000);
  h = recordText(h, "Synthèse E", 1100); // misma rafaga
  h = recordText(h, "Synthèse ED", 1200); // misma rafaga
  assert.deepEqual(h.past, ["Synthèse"]);
  h = recordText(h, "Synthèse EDITADO", 5000); // tras una pausa
  assert.deepEqual(h.past, ["Synthèse", "Synthèse EDITADO"]);
});

test("texto: deshacer y rehacer todas las veces que haga falta", () => {
  let h = recordText(undefined, "a", 0);
  h = recordText(h, "ab", 10_000);
  h = recordText(h, "abc", 20_000);
  let step = undoText(h, "abcd");
  assert.equal(step.text, "abc");
  step = undoText(step.history, step.text);
  assert.equal(step.text, "ab");
  step = undoText(step.history, step.text);
  assert.equal(step.text, "a");
  assert.equal(undoText(step.history, step.text), null, "ya no queda nada escrito que deshacer");
  let redo = redoText(step.history, step.text);
  assert.equal(redo.text, "ab");
  redo = redoText(redo.history, redo.text);
  redo = redoText(redo.history, redo.text);
  assert.equal(redo.text, "abcd");
  assert.equal(redoText(redo.history, redo.text), null);
});

test("texto: escribir despues de deshacer descarta el rehacer; el historial tiene tope", () => {
  let h = recordText(undefined, "a", 0);
  const step = undoText(h, "ab");
  assert.equal(step.history.future.length, 1);
  h = recordText(step.history, "a", 99_000);
  assert.equal(h.future.length, 0);
  let big;
  for (let i = 0; i < MAX_HISTORY + 20; i += 1) big = recordText(big, `t${i}`, i * 10_000);
  assert.equal(big.past.length, MAX_HISTORY);
  assert.equal(big.past[0], "t20", "se pierden los mas antiguos");
});

const row = (over) => ({
  id: "tu1",
  translatedLiteral: "Synthèse",
  reviewLiteral: null,
  Status: "TRANSLATED_MT",
  block: false,
  blockReason: null,
  mtqeV2Score: 0.98,
  reviewedAt: null,
  ...over,
});

test("accion: la foto guarda texto revisado, estado, candado, nota y si alguien lo habia guardado", () => {
  assert.deepEqual(snapshotOf(row()), {
    reviewLiteral: null,
    Status: "TRANSLATED_MT",
    block: false,
    blockReason: null,
    mtqeV2Score: 0.98,
    reviewed: false,
  });
  assert.deepEqual(
    snapshotOf(row({ reviewLiteral: "X", Status: "EDITED", reviewedAt: "2026-10-06", block: true, blockReason: "MANUAL" })),
    { reviewLiteral: "X", Status: "EDITED", block: true, blockReason: "MANUAL", mtqeV2Score: 0.98, reviewed: true },
  );
  assert.equal(snapshotOf(row({ block: false, blockReason: "MANUAL" })).blockReason, null);
});

test("accion: confirmar con propagacion deja una entrada con todos los segmentos tocados", () => {
  const before = new Map([["tu1", row()], ["tu2", row({ id: "tu2" })]]);
  const entry = actionEntry({
    action: "approve",
    number: 104,
    beforeById: before,
    after: [
      row({ Status: "ACCEPTED", reviewedAt: "x" }),
      row({ id: "tu2", Status: "ACCEPTED", reviewedAt: "x" }),
    ],
  });
  assert.equal(entry.action, "approve");
  assert.equal(entry.number, 104);
  assert.deepEqual(entry.items.map((i) => [i.id, i.before.Status, i.after.Status, i.before.reviewed, i.after.reviewed]), [
    ["tu1", "TRANSLATED_MT", "ACCEPTED", false, true],
    ["tu2", "TRANSLATED_MT", "ACCEPTED", false, true],
  ]);
});

test("accion: lo que no cambio nada no entra en el historial", () => {
  const before = new Map([["tu1", row()]]);
  assert.equal(actionEntry({ action: "save_draft", beforeById: before, after: [row()] }), null);
  const h = recordAction(emptyActionHistory(), null);
  assert.deepEqual(h, { past: [], future: [] });
});

test("accion: deshacer, rehacer, y una accion nueva descarta el rehacer", () => {
  const e1 = { action: "approve", number: 1, items: [{ id: "a" }] };
  const e2 = { action: "reject", number: 2, items: [{ id: "b" }] };
  let h = recordAction(recordAction(emptyActionHistory(), e1), e2);
  let step = undoAction(h);
  assert.equal(step.entry, e2, "se deshace la ultima");
  step = undoAction(step.history);
  assert.equal(step.entry, e1);
  assert.equal(undoAction(step.history), null);
  let redo = redoAction(step.history);
  assert.equal(redo.entry, e1, "se rehace en el orden original");
  h = recordAction(redo.history, { action: "lock", number: 3, items: [{ id: "c" }] });
  assert.equal(h.future.length, 0);
  assert.equal(redoAction(h), null);
  assert.deepEqual(h.past.map((e) => e.number), [1, 3]);
});
