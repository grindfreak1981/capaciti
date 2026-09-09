import "server-only";
import { mkdir, readFile as fsReadFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOADS_DIR = path.resolve(process.cwd(), process.env.UPLOADS_DIR ?? "./uploads");

/**
 * Storage abstraction for uploaded technical files. The local filesystem
 * implementation below stores files outside `public/` so nothing is ever
 * served by guessing a URL — every read goes through an authenticated
 * route handler. Swapping to S3/GCS later only means implementing this
 * interface again; nothing above this layer needs to change.
 */
export interface FileStorage {
  save(buffer: Buffer, extension: string): Promise<string>;
  read(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}

class LocalFileStorage implements FileStorage {
  async save(buffer: Buffer, extension: string): Promise<string> {
    const key = `${randomUUID()}.${extension}`;
    await mkdir(UPLOADS_DIR, { recursive: true });
    await writeFile(path.join(UPLOADS_DIR, key), buffer);
    return key;
  }

  async read(storageKey: string): Promise<Buffer> {
    // storageKey is always server-generated (randomUUID + fixed
    // extension), but strip any directory components defensively so a
    // corrupted/forged key can never escape the uploads directory.
    const safeKey = path.basename(storageKey);
    return fsReadFile(path.join(UPLOADS_DIR, safeKey));
  }

  async delete(storageKey: string): Promise<void> {
    const safeKey = path.basename(storageKey);
    await unlink(path.join(UPLOADS_DIR, safeKey)).catch(() => undefined);
  }
}

export const fileStorage: FileStorage = new LocalFileStorage();
