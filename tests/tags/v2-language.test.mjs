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
  assert.equal(toV2LanguageTag("ro"), "ro-ro");
  assert.equal(toV2LanguageTag("xx"), "xx-xx", "desconocido: se duplica");
});

// Un codigo simple que MTQE no tiene duplicado ("el-el") lo rechazaba con HTTP 422
// (2026-11-06: los documentos en->el del proyecto Leginda se quedaron sin notas).
test("MTQE v2: los simples sin 'xx-xx' en el servicio van con su region", () => {
  assert.equal(toV2LanguageTag("el"), "el-gr");
  assert.equal(toV2LanguageTag("EL"), "el-gr");
  assert.equal(toV2LanguageTag("sl"), "sl-si");
  assert.equal(toV2LanguageTag("et"), "et-ee");
  assert.equal(toV2LanguageTag("ja"), "ja-jp");
  assert.equal(toV2LanguageTag("zh"), "zh-cn");
  assert.equal(toV2LanguageTag("sq"), "sq", "el servicio lo publica sin region");
  assert.equal(toV2LanguageTag("el-GR"), "el-gr", "con region: sin cambios");
});

// Lista de GET /languages del MTQE de produccion (vsgpu02:8800, 91 codigos, leida 2026-11-06).
const MTQE_LANGUAGES = [
  "sq", "am-et", "ar-001", "hy-am", "az-az", "eu-es", "bn-bd", "bs", "bg-bg", "my-mm", "ca-es",
  "ca-it", "zh-cn", "zh-tw", "hr-hr", "cs-cz", "da-dk", "nl-nl", "ar-eg", "ar-ae", "en-gb",
  "en-us", "et-ee", "fil-ph", "fi-fi", "fr-ca", "fr-fr", "gl-es", "ka-ge", "de-at", "de-de",
  "de-it", "el-gr", "gu-in", "ha-ng", "he-il", "hi-in", "hu-hu", "is-is", "id-id", "ga", "it-it",
  "ja-jp", "kn-in", "kr", "kk", "km", "ko-kr", "lv-lv", "lt-lt", "mk-mk", "ms-my", "ml-in", "mt",
  "mr-in", "es-mx", "mn", "nb-no", "nn-no", "oc-fr", "fa-ir", "pl-pl", "pt-br", "pt-pt", "pa-in",
  "qu-pe", "ro-ro", "ru-ru", "ar-sa", "sr-rs", "sr-latn-me", "sk-sk", "sl-si", "es-es", "sw-ke",
  "sw-tz", "sv-se", "tg", "ta-in", "te-in", "th-th", "tr-tr", "tk", "es-us", "uk-ua", "ur-pk",
  "uz", "ca-es-valencia", "vi-vn", "cy", "zu-za",
];

test("MTQE v2: todo idioma del servicio, escrito sin region, da un codigo que el servicio acepta", () => {
  const accepted = new Set(MTQE_LANGUAGES);
  const primaries = [...new Set(MTQE_LANGUAGES.map((code) => code.split("-")[0]))];
  const rejected = primaries.filter((primary) => !accepted.has(toV2LanguageTag(primary)));
  assert.deepEqual(rejected, []);
});

test("MTQE v2: vacio o nulo no revienta", () => {
  assert.equal(toV2LanguageTag(""), "");
  assert.equal(toV2LanguageTag(null), "");
  assert.equal(toV2LanguageTag("  en_GB "), "en-gb");
});
