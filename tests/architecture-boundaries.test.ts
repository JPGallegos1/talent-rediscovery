import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

async function collectSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectSourceFiles(path);
      }

      return sourceExtensions.has(extname(entry.name)) ? [path] : [];
    }),
  );

  return files.flat();
}

describe("architecture boundaries", () => {
  it("keeps the admin layer from directly accessing Supabase", async () => {
    const adminFiles = await collectSourceFiles(fileURLToPath(new URL("../src", import.meta.url)));
    const forbiddenPatterns = [/@supabase\/supabase-js/, /createClient\s*\(/, /SUPABASE_/];
    const violations: string[] = [];

    for (const file of adminFiles) {
      const content = await readFile(file, "utf8");

      if (forbiddenPatterns.some((pattern) => pattern.test(content))) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });
});
