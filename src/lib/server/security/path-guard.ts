import path from 'node:path';

export const OUTPUT_DIR = path.resolve('output');

export function getSafeFilePath(filename: string): string {
  const clean = path.normalize(filename).replace(/^[\/\\]+/, '');
  const resolved = path.resolve(OUTPUT_DIR, clean);
  if (!resolved.startsWith(OUTPUT_DIR)) {
    throw new Error('Access Denied: Path traversal detected.');
  }
  return resolved;
}
