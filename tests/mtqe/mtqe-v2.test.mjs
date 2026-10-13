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
  MTQE_V2_ENDPOINTS,
  MTQE_V2_JOB_START_TIMEOUT_MS,
  MTQE_V2_MAX_REFERENCES,
  MTQE_V2_MAX_SEGMENTS,
  MtqeJobError,
  buildReferencesJobBody,
  buildScoreSegmentsBody,
  chunkSegments,
  jobDownloadUrl,
  jobStatusUrl,
  mtqeBaseUrl,
  mtqeEndpoint,
  referencesJobUrl,
  runReferencesJob,
  scoreSegmentsUrl,
  toReferenceEntries,
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

test("MTQE v2: las instrucciones del perfil viajan como instructions, un texto para toda la tanda", () => {
  const body = buildScoreSegmentsBody({
    segments: pairs(2),
    sourceLanguage: "en",
    targetLanguage: "es",
    tmIds: ["tm1"],
    instructions: "  Tutea al lector.\nNo traduzcas «Smart Valve».  ",
  });
  assert.equal(body.instructions, "Tutea al lector.\nNo traduzcas «Smart Valve».");
  assert.equal(body.segments.length, 2);
  assert.deepEqual(Object.keys(body.segments[0]), ["source", "target"], "no van dentro de cada segmento");
  assert.deepEqual(body.tm_id, ["tm1"], "lo demas no cambia");
});

test("MTQE v2: sin instrucciones (perfil sin ellas, documento sin perfil) el campo no se manda", () => {
  const base = { segments: pairs(1), sourceLanguage: "en", targetLanguage: "es", glossaryIds: ["g1"] };
  for (const instructions of [undefined, null, "", "   \n\t ", 42, {}]) {
    const body = buildScoreSegmentsBody({ ...base, instructions });
    assert.equal("instructions" in body, false, `valor ${JSON.stringify(instructions)}`);
    assert.deepEqual(body, buildScoreSegmentsBody(base), "el cuerpo es el de siempre");
  }
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

// --- Trabajo asincrono con las referencias en texto (/jobs/score-with-references) ---
// Contrato leido del openapi del servicio de produccion (2.6.5) el 2026-10-13: cada segmento
// lleva sus `tm` / `glossary` como [{ source, target, score? }]; se crea el trabajo, se
// pregunta por el hasta "done" y se descargan las notas, una por segmento y en orden.
const BASE = "http://host:8800/mtqe/v2";

test("MTQE v2: por defecto se usa el trabajo con referencias; score-segments solo si se pide", () => {
  assert.equal(MTQE_V2_ENDPOINTS.REFERENCES_JOB, "jobs/score-with-references");
  for (const raw of [undefined, null, "", "jobs/score-with-references", "/jobs/score-with-references/", "otra-cosa"]) {
    assert.equal(mtqeEndpoint(raw), MTQE_V2_ENDPOINTS.REFERENCES_JOB, `valor ${JSON.stringify(raw)}`);
  }
  for (const raw of ["score-segments", " /Score-Segments/ "]) {
    assert.equal(mtqeEndpoint(raw), MTQE_V2_ENDPOINTS.SEGMENTS, `valor ${JSON.stringify(raw)}`);
  }
});

test("MTQE v2: MTQE_V2 es la base del servicio; una URL de endpoint antigua sigue valiendo", () => {
  for (const configured of [
    BASE,
    `${BASE}/`,
    `${BASE}/score-with-references`,
    `${BASE}/score-segments`,
    `${BASE}/jobs/score-with-references`,
    `${BASE}/score`,
  ]) {
    assert.equal(mtqeBaseUrl(configured), BASE, configured);
    assert.equal(referencesJobUrl(configured), `${BASE}/jobs/score-with-references`);
    assert.equal(scoreSegmentsUrl(configured), `${BASE}/score-segments`);
  }
  assert.equal(jobStatusUrl(BASE, "abc 1"), `${BASE}/jobs/abc%201`);
  assert.equal(jobDownloadUrl(BASE, "abc"), `${BASE}/jobs/abc/download?format=json`);
  assert.equal(mtqeBaseUrl(""), "");
  assert.equal(referencesJobUrl(undefined), "", "sin configurar = sin QE");
});

test("MTQE v2: las referencias guardadas del segmento viajan como texto, cada pareja una vez", () => {
  const tmInfo = [
    { source: "Save your work.", target: "Guarda tu trabajo.", tm_score: 0.82, tm_id: "tm1", resource_type: "REFERENCE_FILE" },
    // La misma pareja desde la memoria de trabajo del documento, con otro valor: gana el mejor.
    { source: "Save your work.", target: "Guarda tu trabajo.", tm_score: "0.91", tm_id: "doc" },
    { source: "Close the file.", target: "Cierra el archivo.", tm_score: 0.4 },
    { source: "Sin target" },
    { source: "  ", target: "x" },
    null,
  ];
  assert.deepEqual(toReferenceEntries(tmInfo), [
    { source: "Save your work.", target: "Guarda tu trabajo.", score: 0.91 },
    { source: "Close the file.", target: "Cierra el archivo.", score: 0.4 },
  ]);
  assert.deepEqual(toReferenceEntries(null), []);
  assert.deepEqual(toReferenceEntries("no es una lista"), []);
});

test("MTQE v2: la similitud solo viaja si es un valor de 0 a 1; un glosario puntuado en otra escala va sin ella", () => {
  assert.deepEqual(
    toReferenceEntries([
      { source: "valve", target: "válvula", tm_score: 19.13 },
      { source: "pump", target: "bomba" },
      { source: "pipe", target: "tubería", score: 1 },
    ]),
    [
      { source: "pipe", target: "tubería", score: 1 },
      { source: "valve", target: "válvula" },
      { source: "pump", target: "bomba" },
    ],
    "con valor primero; las que no lo tienen, en su orden",
  );
});

test("MTQE v2: como mucho 5 referencias por segmento y tipo, las mejores", () => {
  assert.equal(MTQE_V2_MAX_REFERENCES, 5);
  const many = Array.from({ length: 12 }, (_, i) => ({ source: `s${i}`, target: `t${i}`, tm_score: i / 20 }));
  const entries = toReferenceEntries(many);
  assert.equal(entries.length, 5);
  assert.deepEqual(entries.map((entry) => entry.source), ["s11", "s10", "s9", "s8", "s7"]);
});

test("MTQE v2: el cuerpo del trabajo lleva las referencias por segmento y las instrucciones del perfil", () => {
  const body = buildReferencesJobBody({
    segments: [
      {
        source: "Open the Smart Valve.",
        target: "Abre la Smart Valve.",
        tmInfo: [{ source: "Open the valve.", target: "Abre la válvula.", tm_score: 0.8 }],
        glossaryInfo: [{ source: "Smart Valve", target: "Smart Valve" }],
        id: "no-viaja",
      },
      { source: "Close the file.", target: "Cierra el archivo.", tmInfo: null, glossaryInfo: [] },
    ],
    sourceLanguage: "en_GB",
    targetLanguage: "es",
    instructions: "  Tutea al lector.  ",
  });
  assert.deepEqual(body, {
    segments: [
      {
        source: "Open the Smart Valve.",
        target: "Abre la Smart Valve.",
        tm: [{ source: "Open the valve.", target: "Abre la válvula.", score: 0.8 }],
        glossary: [{ source: "Smart Valve", target: "Smart Valve" }],
      },
      // Sin referencias: listas vacias, que es como el servicio entiende "este segmento no tiene".
      { source: "Close the file.", target: "Cierra el archivo.", tm: [], glossary: [] },
    ],
    source_language: "en-gb",
    target_language: "es-es",
    ape: false,
    instructions: "Tutea al lector.",
  });
  assert.equal("tm_id" in body, false, "en este contrato no viajan ids");
});

test("MTQE v2: el trabajo sin instrucciones no manda el campo; y admite de 1 a 50 segmentos", () => {
  const lang = { sourceLanguage: "en", targetLanguage: "es" };
  for (const instructions of [undefined, null, "", "  \n "]) {
    assert.equal("instructions" in buildReferencesJobBody({ segments: pairs(1), ...lang, instructions }), false);
  }
  assert.equal(buildReferencesJobBody({ segments: pairs(50), ...lang }).segments.length, 50);
  assert.throws(() => buildReferencesJobBody({ segments: pairs(51), ...lang }), /1 to 50 segments/);
  assert.throws(() => buildReferencesJobBody({ segments: [], ...lang }), /1 to 50 segments/);
});

// Un servicio de mentira: contesta a cada consulta de estado con el siguiente de `states`
// (el ultimo se repite) y avanza un reloj falso con cada espera.
function fakeService({ states, results, jobId = "job-1" }) {
  const calls = [];
  let clock = 0;
  let polls = 0;
  return {
    calls,
    now: () => clock,
    sleep: async (ms) => { clock += ms; },
    http: {
      post: async (url, body) => { calls.push(["POST", url, body]); return { job_id: jobId, status: "pending", total: body.segments.length, processed: 0 }; },
      get: async (url) => {
        calls.push(["GET", url]);
        if (url.endsWith("/download?format=json")) return results;
        const state = states[Math.min(polls, states.length - 1)];
        polls += 1;
        return { job_id: jobId, total: 2, processed: 0, error: null, ...state };
      },
    },
  };
}
const jobBody = () => buildReferencesJobBody({ segments: pairs(2), sourceLanguage: "en", targetLanguage: "es" });

test("MTQE v2 trabajo: crea, pregunta hasta done y devuelve una nota 0-1 por segmento, en orden", async () => {
  const service = fakeService({
    states: [{ status: "pending" }, { status: "processing", processed: 1 }, { status: "done", processed: 2 }],
    results: [{ score: 96.5 }, { score: null }],
  });
  const body = jobBody();
  const scores = await runReferencesJob({ http: service.http, configured: `${BASE}/score-with-references`, body, sleep: service.sleep, now: service.now });
  assert.deepEqual(scores, [0.965, null], "un segmento sin nota queda en null");
  assert.deepEqual(service.calls.map(([method, url]) => `${method} ${url}`), [
    `POST ${BASE}/jobs/score-with-references`,
    `GET ${BASE}/jobs/job-1`,
    `GET ${BASE}/jobs/job-1`,
    `GET ${BASE}/jobs/job-1`,
    `GET ${BASE}/jobs/job-1/download?format=json`,
  ]);
  assert.equal(service.calls[0][2], body, "el cuerpo viaja tal cual");
});

test("MTQE v2 trabajo: si nadie lo recoge (sigue pending) se da por parado, sin esperar el tiempo entero", async () => {
  const service = fakeService({ states: [{ status: "pending" }], results: [] });
  await assert.rejects(
    runReferencesJob({ http: service.http, configured: BASE, body: jobBody(), sleep: service.sleep, now: service.now }),
    (error) => {
      assert.ok(error instanceof MtqeJobError);
      assert.equal(error.notStarted, true);
      assert.equal(error.jobId, "job-1");
      assert.match(error.message, /not picked up in 120 s/);
      return true;
    },
  );
  assert.equal(MTQE_V2_JOB_START_TIMEOUT_MS, 120_000);
  assert.ok(service.now() >= 120_000 && service.now() < 130_000, `espero ${service.now()} ms`);
  assert.equal(service.calls.some(([, url]) => url.includes("/download")), false);
});

test("MTQE v2 trabajo: uno que arranca pero no acaba agota su tiempo (y no cuenta como parado)", async () => {
  const service = fakeService({ states: [{ status: "pending" }, { status: "processing", processed: 1 }], results: [] });
  await assert.rejects(
    runReferencesJob({ http: service.http, configured: BASE, body: jobBody(), timeoutMs: 30_000, sleep: service.sleep, now: service.now }),
    (error) => {
      assert.equal(error.notStarted, false);
      assert.match(error.message, /did not finish in 30 s \(processing, 1\/2\)/);
      return true;
    },
  );
});

test("MTQE v2 trabajo: con poco tiempo (re-puntuar un segmento) el limite es ese, no los 120 s", async () => {
  const service = fakeService({ states: [{ status: "pending" }], results: [] });
  await assert.rejects(
    runReferencesJob({ http: service.http, configured: BASE, body: jobBody(), timeoutMs: 8_000, pollMs: 500, sleep: service.sleep, now: service.now }),
    /did not finish in 8 s/,
  );
  assert.ok(service.now() >= 8_000 && service.now() <= 8_500);
});

test("MTQE v2 trabajo: un trabajo en error, uno sin id y unas notas que no cuadran se rechazan", async () => {
  const failed = fakeService({ states: [{ status: "error", error: "DAAIT down" }], results: [] });
  await assert.rejects(
    runReferencesJob({ http: failed.http, configured: BASE, body: jobBody(), sleep: failed.sleep, now: failed.now }),
    /job job-1 failed: DAAIT down/,
  );
  const noId = fakeService({ states: [{ status: "done" }], results: [], jobId: null });
  await assert.rejects(
    runReferencesJob({ http: noId.http, configured: BASE, body: jobBody(), sleep: noId.sleep, now: noId.now }),
    /did not return a job id/,
  );
  const short = fakeService({ states: [{ status: "done" }], results: [{ score: 90 }] });
  await assert.rejects(
    runReferencesJob({ http: short.http, configured: BASE, body: jobBody(), sleep: short.sleep, now: short.now }),
    /1 results for 2 segments/,
  );
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

test("EN VIVO: con instructions responde 200 y una nota por segmento (un servicio anterior al campo lo ignora)", live, async () => {
  const response = await post(pairs(2), { instructions: "Address the reader informally (tú, never usted)." });
  assert.equal(response.status, 200);
  assert.equal(toUnitScores(await response.json(), 2).length, 2);
});
