import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const workspaceRoot = fileURLToPath(new URL("..", import.meta.url));

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
    const adminFiles = await collectSourceFiles(join(workspaceRoot, "apps", "admin", "src"));
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

  it("keeps the domain package free of runtime and app dependencies", async () => {
    const domainFiles = await collectSourceFiles(join(workspaceRoot, "packages", "domain", "src"));
    const forbiddenPatterns = [
      /from\s+["'](?:\.\.\/\.\.\/|\.\.\/\.\.\\)/,
      /from\s+["'](?:\.\.\/src|\.\.\\src|\.\.\/server|\.\.\\server)/,
      /from\s+["'](?:@supabase\/supabase-js|hono|ai|@ai-sdk\/|react|react-dom|zustand)/,
      /process\.env/,
      /SUPABASE_/,
    ];
    const violations: string[] = [];

    for (const file of domainFiles) {
      const content = await readFile(file, "utf8");

      if (forbiddenPatterns.some((pattern) => pattern.test(content))) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });

  it("keeps the API from importing domain logic through the admin source tree", async () => {
    const apiFiles = await collectSourceFiles(join(workspaceRoot, "apps", "api", "src"));
    const forbiddenAdminImportPattern = /from\s+["'][^"']*(?:apps\/admin\/src|admin\/src|@recollect\/admin)(?:\/|["'])/;
    const violations: string[] = [];

    for (const file of apiFiles) {
      const content = await readFile(file, "utf8");

      if (forbiddenAdminImportPattern.test(content)) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });

  it("keeps the admin layer from importing apps/api implementation files", async () => {
    const adminFiles = await collectSourceFiles(join(workspaceRoot, "apps", "admin", "src"));
    const forbiddenPatterns = [/from\s+["']@recollect\/api["']/, /from\s+["'][^"']*apps\/api\/src["']/];
    const violations: string[] = [];

    for (const file of adminFiles) {
      const content = await readFile(file, "utf8");

      if (forbiddenPatterns.some((pattern) => pattern.test(content))) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });

  it("keeps the admin layer from reading backend secret environment variables", async () => {
    const adminFiles = await collectSourceFiles(join(workspaceRoot, "apps", "admin", "src"));
    const envVarPatterns = [/\bSUPABASE_SECRET_KEY\b/, /\bMEM0_API_KEY\b/, /\bOPENAI_API_KEY\b/];
    const violations: string[] = [];

    for (const file of adminFiles) {
      const content = await readFile(file, "utf8");

      if (envVarPatterns.some((pattern) => pattern.test(content))) {
        violations.push(file);
      }
    }

    const allowedFiles = new Set(["boundary-check.ts", "intelligence-layer.contract-check.ts"]);
    const reportedViolations = violations.filter((file) => {
      const baseName = file.split(/[/\\]/).pop() ?? "";
      return !allowedFiles.has(baseName);
    });

    expect(reportedViolations).toEqual([]);
  });

  it("forbids TanStack Start server routes from bypassing apps/api for durable work", async () => {
    const adminFiles = await collectSourceFiles(join(workspaceRoot, "apps", "admin", "src"));
    const serverFnPattern = /createServerFn\s*\(/;
    const apiRoutePattern = /createServerFileRoute\s*\(/;
    const adminApiImportPattern = /from\s+["']\.\.\/api-client/;
    const violations: string[] = [];

    for (const file of adminFiles) {
      const content = await readFile(file, "utf8");

      const hasServerCode = serverFnPattern.test(content) || apiRoutePattern.test(content);

      if (hasServerCode) {
        const delegatesToApi = adminApiImportPattern.test(content) || /\/api\//.test(content);
        const hasDocumentedDelegation = /delegates?\s+(secure|durable|persist|supabase)/i.test(content) || /frontend.?owned\s*(BFF|middleware)/i.test(content);

        if (!delegatesToApi && !hasDocumentedDelegation) {
          violations.push(file);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
