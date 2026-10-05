// Contrato de MTQE v2 que usa PECAT-E: POST <base>/score-segments (mtqe-v2-api 2.6.5),
// de 1 a 50 segmentos por peticion, `ape` obligatorio. Medido contra el servicio real el
// 2026-10-05: 50 segmentos = 200; 51 = 422; sin `ape` = 422; sin X-API-Key = 401.
// node --test "tests/**/*.test.mjs"
//
// Las pruebas "EN VIVO" llaman al servicio y solo corren si se le dice donde esta:
//   MTQE_V2_LIVE=http://<host>:8800/mtqe/v2 MTQE_V2_LIVE_KEY=<clave> npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MTQE_V2_MAX_SEGMENTS,
  buildScoreSegmentsBody,
  chunkSegments,
  scoreSegmentsUrl,
  toUnitScores,
} from "../../lib/mtqe-v2.js";

const pairs = (n) =>
  Array.from({ length: n }, (_, i) => ({
    source: `The meeting starts at ${(i % 12) + 1} o'clock.`,
    target: `La reunión empieza a las ${(i % 12) + 1}.`,
  }));

test("MTQE v2: la URL acaba siempre en /score-segments", () => {
  const url = "http://host:8800/mtqe/v2/score-segments";
  assert.equal(scoreSegmentsUrl("http://host:8800/mtqe/v2"), url);
  assert.equal(scoreSegmentsUrl("http://host:8800/mtqe/v2/"), url);
  assert.equal(scoreSegmentsUrl(url), url);
  assert.equal(
    scoreSegmentsUrl("http://host:8800/mtqe/v2/score-with-references"),
    url,
    "un .env de la version anterior sigue valiendo",
  );
  assert.equal(scoreSegmentsUrl("http://host:8800/mtqe/v2/score"), url);
  assert.equal(scoreSegmentsUrl(""), "", "sin configurar = sin QE");
  assert.equal(scoreSegmentsUrl(undefined), "");
});

test("MTQE v2: el cuerpo es el del contrato (segments + idiomas xx-yy + ape:false)", () => {
  const body = buildScoreSegmentsBody({
    segments: [
      {
        source: "Please save your work before closing the application.",
        target: "Guarde su trabajo antes de cerrar la aplicación.",
        id: "no-viaja",
      },
      {
        source: "He did not finish the work on time.",
        target: "Él terminó el trabajo a tiempo.",
      },
    ],
    sourceLanguage: "en",
    targetLanguage: "es_ES",
  });
  assert.deepEqual(body, {
    segments: [
      {
        source: "Please save your work before closing the application.",
        target: "Guarde su trabajo antes de cerrar la aplicación.",
      },
      {
        source: "He did not finish the work on time.",
        target: "Él terminó el trabajo a tiempo.",
      },
    ],
    source_language: "en-us",
    target_language: "es-es",
    ape: false,
  });
});

test("MTQE v2: memorias y glosarios viajan como tm_id / glossary_id, sin vacios ni repetidos", () => {
  const body = buildScoreSegmentsBody({
    segments: pairs(1),
    sourceLanguage: "en-GB",
    targetLanguage: "fr-FR",
    tmIds: ["tm1", " tm2 ", "tm1", "", null],
    glossaryIds: ["g1"],
  });
  assert.deepEqual(body.tm_id, ["tm1", "tm2"]);
  assert.deepEqual(body.glossary_id, ["g1"]);
  assert.equal(body.source_language, "en-gb");
  assert.equal(body.target_language, "fr-fr");
});

test("MTQE v2: sin recursos no se mandan tm_id ni glossary_id", () => {
  const body = buildScoreSegmentsBody({
    segments: pairs(1),
    sourceLanguage: "en",
    targetLanguage: "es",
    tmIds: [],
  });
  assert.equal("tm_id" in body, false);
  assert.equal("glossary_id" in body, false);
});

test("MTQE v2: 50 segmentos caben en una peticion; 51 y 0 no", () => {
  assert.equal(MTQE_V2_MAX_SEGMENTS, 50);
  const lang = { sourceLanguage: "en", targetLanguage: "es" };
  assert.equal(
    buildScoreSegmentsBody({ segments: pairs(50), ...lang }).segments.length,
    50,
  );
  assert.throws(
    () => buildScoreSegmentsBody({ segments: pairs(51), ...lang }),
    /1 to 50 segments/,
  );
  assert.throws(
    () => buildScoreSegmentsBody({ segments: [], ...lang }),
    /1 to 50 segments/,
  );
});

test("MTQE v2: un documento se parte en tandas de 50 sin perder ni desordenar segmentos", () => {
  const tus = Array.from({ length: 120 }, (_, i) => ({ id: i }));
  const chunks = chunkSegments(tus);
  assert.deepEqual(
    chunks.map((chunk) => chunk.length),
    [50, 50, 20],
  );
  assert.deepEqual(chunks.flat(), tus);
  assert.deepEqual(chunkSegments([]), []);
  assert.deepEqual(
    chunkSegments(pairs(50)).map((chunk) => chunk.length),
    [50],
  );
});

test("MTQE v2: las notas 0-100 se guardan 0-1, y un segmento fallido queda en null", () => {
  const scores = toUnitScores(
    [
      { score: 100.0, error: null },
      { score: 18.41, error: null },
      { score: null, error: "upstream" },
      { score: 0, error: null },
    ],
    4,
  );
  assert.equal(scores[0], 1);
  assert.ok(Math.abs(scores[1] - 0.1841) < 1e-9);
  assert.equal(scores[2], null);
  assert.equal(scores[3], 0, "un 0 es una nota, no un fallo");
});

test("MTQE v2: una respuesta que no trae una nota por segmento se rechaza entera", () => {
  assert.throws(() => toUnitScores([{ score: 90 }], 2), /1 results for 2 segments/);
  assert.throws(() => toUnitScores({ detail: "x" }, 1), /no results for 1 segments/);
});

// --- EN VIVO -----------------------------------------------------------------------
const LIVE = process.env.MTQE_V2_LIVE || "";
const live = { skip: LIVE ? false : "define MTQE_V2_LIVE para llamar al servicio" };

const post = (segments, extra = {}, withKey = true) =>
  fetch(scoreSegmentsUrl(LIVE), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(withKey ? { "X-API-Key": process.env.MTQE_V2_LIVE_KEY || "" } : {}),
    },
    body: JSON.stringify({
      ...buildScoreSegmentsBody({
        segments,
        sourceLanguage: "en",
        targetLanguage: "es",
      }),
      ...extra,
    }),
  });

test("EN VIVO: el ejemplo del contrato devuelve una nota por segmento, en orden", live, async () => {
  const segments = [
    {
      source: "Please save your work before closing the application.",
      target: "Guarde su trabajo antes de cerrar la aplicación.",
    },
    {
      source: "He did not finish the work on time.",
      target: "Él terminó el trabajo a tiempo.",
    },
  ];
  const response = await post(segments);
  assert.equal(response.status, 200);
  const results = await response.json();
  assert.deepEqual(
    results.map((result) => result.source),
    segments.map((segment) => segment.source),
  );
  const [good, wrong] = toUnitScores(results, 2);
  assert.ok(good > 0.9, `la traduccion correcta puntua alto (${good})`);
  assert.ok(wrong < 0.5, `la que cambia el sentido puntua bajo (${wrong})`);
});

test("EN VIVO: 50 segmentos entran y 51 se rechazan con 422", live, async () => {
  const full = await post(pairs(50));
  assert.equal(full.status, 200);
  assert.equal(toUnitScores(await full.json(), 50).length, 50);

  const tooMany = await fetch(scoreSegmentsUrl(LIVE), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.MTQE_V2_LIVE_KEY || "",
    },
    body: JSON.stringify({
      segments: pairs(51),
      source_language: "en-us",
      target_language: "es-es",
      ape: false,
    }),
  });
  assert.equal(tooMany.status, 422);
});

test("EN VIVO: sin `ape` responde 422 y sin clave 401", live, async () => {
  const noApe = await post(pairs(1), { ape: undefined });
  assert.equal(noApe.status, 422);
  const noKey = await post(pairs(1), {}, false);
  assert.equal(noKey.status, 401);
});
