// El idioma que va a MTQE v2: con guion bajo (en_GB / fr_FR, como llegan en un .xlf) el
// servicio devolvia HTTP 400 y el documento se quedaba sin notas (medido en produccion
// 2026-10-02: 7 documentos). node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { toV2LanguageTag } from "../../lib/v2-language.js";

test("MTQE v2: el guion bajo se normaliza a guion", () => {
  assert.equal(toV2LanguageTag("en_GB"), "en-gb");
  assert.equal(toV2LanguageTag("fr_FR"), "fr-fr");
  assert.equal(toV2LanguageTag("pt_BR"), "pt-br");
});

test("MTQE v2: los codigos con guion y los simples siguen como antes", () => {
  assert.equal(toV2LanguageTag("en-US"), "en-us");
  assert.equal(toV2LanguageTag("fr-fr"), "fr-fr");
  assert.equal(toV2LanguageTag("en"), "en-us");
  assert.equal(toV2LanguageTag("ES"), "es-es");
  assert.equal(toV2LanguageTag("ja"), "ja-ja", "desconocido: se duplica");
});

test("MTQE v2: vacio o nulo no revienta", () => {
  assert.equal(toV2LanguageTag(""), "");
  assert.equal(toV2LanguageTag(null), "");
  assert.equal(toV2LanguageTag("  en_GB "), "en-gb");
});
