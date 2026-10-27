#!/usr/bin/env node
// Genera una imagen con Gemini y la guarda en img/.
//
// Uso:
//   GEMINI_API_KEY=... node scripts/gemini-image.mjs "prompt" [salida.png]
//
// Variables opcionales:
//   GEMINI_MODEL  modelo de imagen (por defecto gemini-2.5-flash-image)

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const key = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-image';
const [prompt, out = `img/gemini-${Date.now()}.png`] = process.argv.slice(2);

if (!key || !prompt) {
  console.error('Uso: GEMINI_API_KEY=... node scripts/gemini-image.mjs "prompt" [salida.png]');
  process.exit(1);
}

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  }
);

if (!res.ok) {
  console.error(`Error ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const data = await res.json();
const parts = data.candidates?.[0]?.content?.parts ?? [];
const img = parts.find((p) => (p.inlineData ?? p.inline_data)?.data);

if (!img) {
  console.error('Gemini no devolvió ninguna imagen:', JSON.stringify(parts).slice(0, 500));
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dest = resolve(root, out);
await mkdir(dirname(dest), { recursive: true });
await writeFile(dest, Buffer.from((img.inlineData ?? img.inline_data).data, 'base64'));
console.log(`Guardada en ${dest}`);
