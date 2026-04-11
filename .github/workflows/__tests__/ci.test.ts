import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parse } from "yaml";

describe("ci.yml security job", () => {
  const ciPath = resolve(__dirname, "..", "ci.yml");
  const ciContent = readFileSync(ciPath, "utf-8");
  const ci = parse(ciContent);

  it("npm audit step should not have continue-on-error", () => {
    const securityJob = ci.jobs.security;
    const auditStep = securityJob.steps.find(
      (step: { name?: string }) => step.name === "Run npm audit"
    );

    expect(auditStep).toBeDefined();
    expect(
      (auditStep as Record<string, unknown>)["continue-on-error"]
    ).toBeUndefined();
  });
});
