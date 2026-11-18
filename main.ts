// news-image-20261118 entry: copy the rendered front page to the output dir.
// Node 22, standard library only. Refuses to ship an image over the 1 MiB limit.
import { closeSync, copyFileSync, mkdirSync, openSync, readSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'entry.png');
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const size = statSync(src).size;
if (size > 1024 * 1024) {
  throw new Error(`entry.png is ${size} bytes, over the 1 MiB limit`);
}
// Validate the source really is a PNG: check the 8-byte magic signature
// (89 50 4E 47 0D 0A 1A 0A) and read the IHDR chunk for its dimensions.
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const fd = openSync(src, 'r');
const head = Buffer.alloc(24);
if (readSync(fd, head, 0, 24, 0) < 24) {
  closeSync(fd);
  throw new Error('entry.png is too short to be a PNG');
}
closeSync(fd);
if (!head.subarray(0, 8).equals(PNG_MAGIC)) {
  throw new Error('entry.png is not a PNG (bad magic signature)');
}
if (head.toString('ascii', 12, 16) !== 'IHDR') {
  throw new Error('entry.png has no IHDR chunk where a PNG should');
}
const width = head.readUInt32BE(16);
const height = head.readUInt32BE(20);
if (width > 1024 || height > 1024) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 limit`);
}
mkdirSync(outDir, { recursive: true });
copyFileSync(src, join(outDir, 'entry.png'));
console.log(`copied entry.png (${size} bytes) to ${outDir}`);
