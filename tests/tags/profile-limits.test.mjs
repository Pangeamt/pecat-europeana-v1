// Maximo de las "Instrucciones" de un perfil: sale de PROFILE_INSTRUCTIONS_MAX (.env), 5.000
// caracteres si no esta o no es un entero mayor que cero, y nunca por encima de lo que cabe en
// la columna (TEXT de MySQL, 65.535 bytes). node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_INSTRUCTIONS_MAX,
  INSTRUCTIONS_COLUMN_BYTES,
  fitsInstructionsColumn,
  instructionsMax,
} from "../../lib/profile-limits.js";

// El limite se lee al cargar el modulo: cada valor de la variable pide su propia copia.
async function schemasWith(limit) {
  if (limit === undefined) delete process.env.PROFILE_INSTRUCTIONS_MAX;
  else process.env.PROFILE_INSTRUCTIONS_MAX = limit;
  return import(`../../modules/profiles/schemas.js?limit=${limit ?? "none"}`);
}

const create = (instructions) => ({ name: "Perfil", llmPreset: "basic", instructions });

test("sin variable, o con un valor que no vale, el maximo es el de siempre", () => {
  assert.equal(DEFAULT_INSTRUCTIONS_MAX, 5000);
  for (const raw of [undefined, null, "", "   ", "abc", "0", "-5", "12.5", "1e4", "5000 caracteres"]) {
    assert.equal(instructionsMax(raw), 5000, `valor ${JSON.stringify(raw)}`);
  }
});

test("un entero mayor que cero manda, hacia arriba y hacia abajo", () => {
  assert.equal(instructionsMax("20000"), 20000);
  assert.equal(instructionsMax(" 20000 "), 20000);
  assert.equal(instructionsMax(20000), 20000);
  assert.equal(instructionsMax("1000"), 1000);
});

test("nunca pasa de lo que cabe en la columna", () => {
  assert.equal(INSTRUCTIONS_COLUMN_BYTES, 65535);
  assert.equal(instructionsMax("65535"), 65535);
  assert.equal(instructionsMax("65536"), 65535);
  assert.equal(instructionsMax("1000000"), 65535);
});

test("lo que cabe en la columna se mide en bytes, no en caracteres", () => {
  assert.equal(fitsInstructionsColumn("a".repeat(65535)), true);
  assert.equal(fitsInstructionsColumn("a".repeat(65536)), false);
  assert.equal(fitsInstructionsColumn("é".repeat(32767)), true, "2 bytes por letra: 65.534");
  assert.equal(fitsInstructionsColumn("é".repeat(32768)), false, "2 bytes por letra: 65.536");
  assert.equal(fitsInstructionsColumn(""), true);
  assert.equal(fitsInstructionsColumn(null), true);
});

test("esquema sin variable: 5.000 entra y 5.001 no, al crear y al editar", async () => {
  const { createProfileSchema, updateProfileSchema } = await schemasWith(undefined);
  assert.equal(createProfileSchema.validate(create("a".repeat(5000))).error, undefined);
  assert.equal(updateProfileSchema.validate({ instructions: "a".repeat(5000) }).error, undefined);
  assert.match(createProfileSchema.validate(create("a".repeat(5001))).error.message, /5000 characters/);
  assert.match(
    updateProfileSchema.validate({ instructions: "a".repeat(5001) }).error.message,
    /5000 characters/,
  );
});

test("esquema con la variable: el maximo es el del .env", async () => {
  const { createProfileSchema, updateProfileSchema } = await schemasWith("20000");
  assert.equal(createProfileSchema.validate(create("a".repeat(20000))).error, undefined);
  assert.equal(updateProfileSchema.validate({ instructions: "a".repeat(20000) }).error, undefined);
  assert.match(createProfileSchema.validate(create("a".repeat(20001))).error.message, /20000 characters/);
  assert.match(
    updateProfileSchema.validate({ instructions: "a".repeat(20001) }).error.message,
    /20000 characters/,
  );
});

test("esquema: vacio y null siguen valiendo, y los espacios de los lados no cuentan", async () => {
  const { createProfileSchema, updateProfileSchema } = await schemasWith(undefined);
  assert.equal(createProfileSchema.validate(create("")).error, undefined);
  assert.equal(createProfileSchema.validate(create(null)).error, undefined);
  assert.equal(updateProfileSchema.validate({}).error, undefined);
  const padded = createProfileSchema.validate(create(`  ${"a".repeat(5000)}  `));
  assert.equal(padded.error, undefined);
  assert.equal(padded.value.instructions.length, 5000);
});

test("esquema: dentro del maximo pero sin sitio en la columna, se rechaza con su propio aviso", async () => {
  const { createProfileSchema } = await schemasWith("65535");
  // 30.000 ideogramas = 90.000 bytes: menos caracteres que el maximo, mas bytes que la columna.
  const result = createProfileSchema.validate(create("中".repeat(30000)));
  assert.match(result.error.message, /"instructions" is too long to be stored/);
  assert.equal(createProfileSchema.validate(create("中".repeat(21845))).error, undefined, "65.535 bytes justos");
});
