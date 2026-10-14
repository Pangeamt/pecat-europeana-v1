import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";

import { newUploadPath, resolveUploadPath, uploadsDir } from "../../lib/uploads.js";

const withUploadsDir = (value, fn) => {
  const previous = process.env.UPLOADS_DIR;
  if (value === undefined) delete process.env.UPLOADS_DIR;
  else process.env.UPLOADS_DIR = value;
  try {
    fn();
  } finally {
    if (previous === undefined) delete process.env.UPLOADS_DIR;
    else process.env.UPLOADS_DIR = previous;
  }
};

test("uploads: la carpeta sale de UPLOADS_DIR, y si no hay, ./uploads (nunca public/)", () => {
  withUploadsDir("/app/uploads", () => assert.equal(uploadsDir(), "/app/uploads"));
  withUploadsDir(undefined, () => assert.equal(uploadsDir(), join(process.cwd(), "uploads")));
  withUploadsDir(undefined, () => assert.ok(!uploadsDir().replace(/\\/g, "/").includes("/public/")));
});

test("uploads: una subida nueva va a la carpeta, con un prefijo al azar y el nombre original", () => {
  withUploadsDir("/app/uploads", () => {
    const first = newUploadPath("Guía de bienvenida.docx");
    const second = newUploadPath("Guía de bienvenida.docx");
    assert.ok(first.startsWith(join("/app/uploads", "/")), first);
    assert.match(first, /_Guía de bienvenida\.docx$/);
    assert.notEqual(first, second);
  });
});

test("uploads: las rutas guardadas antes del cambio se leen desde la carpeta nueva", () => {
  withUploadsDir("/app/uploads", () => {
    assert.equal(resolveUploadPath("./public/files/0e648290467_ejemplo-tienda.xlf"), join("/app/uploads", "0e648290467_ejemplo-tienda.xlf"));
    assert.equal(resolveUploadPath("public/files/abc_doc.docx"), join("/app/uploads", "abc_doc.docx"));
    assert.equal(resolveUploadPath(".\\public\\files\\abc_doc con espacios.docx"), join("/app/uploads", "abc_doc con espacios.docx"));
  });
});

test("uploads: una ruta nueva (o cualquier otra) no se toca, y resolver dos veces da lo mismo", () => {
  withUploadsDir("/app/uploads", () => {
    const fresh = join("/app/uploads", "abc_doc.docx");
    assert.equal(resolveUploadPath(fresh), fresh);
    assert.equal(resolveUploadPath(resolveUploadPath("./public/files/abc_doc.docx")), fresh);
    assert.equal(resolveUploadPath("/tmp/otro/sitio.xlf"), "/tmp/otro/sitio.xlf");
    assert.equal(resolveUploadPath(null), "");
  });
});
