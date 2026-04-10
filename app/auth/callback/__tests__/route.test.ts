import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("auth/callback/route.ts", () => {
  it("should not contain non-null assertions for env variables", () => {
    const filePath = resolve(__dirname, "..", "route.ts");
    const content = readFileSync(filePath, "utf-8");

    expect(content).not.toContain("process.env.NEXT_PUBLIC_SUPABASE_URL!");
    expect(content).not.toContain("process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!");
  });

  it("should import clientEnv from env.client", () => {
    const filePath = resolve(__dirname, "..", "route.ts");
    const content = readFileSync(filePath, "utf-8");

    expect(content).toContain('from "@/lib/env.client"');
  });
});
