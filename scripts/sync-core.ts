/**
 * Chép lõi WebAssembly từ repo riêng (wasm-motion-core) vào src/vendor/ để
 * trang build được mà không cần Rust hay repo kia.
 *   bun run sync:core
 */
import { cpSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = process.env.MOTION_CORE ?? join(dirname(root), 'wasm-motion-core', 'runtime');
const dest = join(root, 'src', 'vendor', 'motion-core');
// chỉ cần ba tệp TS: wasm đã nằm sẵn dạng base64 trong motion-core-wasm.ts
const files = ['core.ts', 'anim.ts', 'motion-core-wasm.ts'];

if (!existsSync(source)) {
  console.error(`không thấy lõi ở ${source} (đặt MOTION_CORE=<đường dẫn runtime/>)`);
  process.exit(1);
}

mkdirSync(dest, { recursive: true });
for (const file of files) {
  const from = join(source, file);
  if (!existsSync(from)) {
    console.error(`thiếu ${file} trong ${source}: chạy bun run build bên repo lõi`);
    process.exit(1);
  }
  cpSync(from, join(dest, file));
  console.log(`${file}: ${statSync(from).size} byte`);
}
