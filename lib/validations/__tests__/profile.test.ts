import { describe, it, expect } from "vitest";
import { updateProfileSchema } from "../profile";

describe("updateProfileSchema", () => {
  it("should accept valid profile data", () => {
    const result = updateProfileSchema.safeParse({
      displayName: "Test User",
      bio: "Hello, world!",
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty object (all optional)", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should reject displayName longer than 50 chars", () => {
    const result = updateProfileSchema.safeParse({
      displayName: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("should reject bio longer than 500 chars", () => {
    const result = updateProfileSchema.safeParse({
      bio: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("should reject occupation longer than 100 chars", () => {
    const result = updateProfileSchema.safeParse({
      occupation: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid gender options", () => {
    for (const gender of ["male", "female", "other", "prefer_not_to_say"]) {
      const result = updateProfileSchema.safeParse({ gender });
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid gender", () => {
    const result = updateProfileSchema.safeParse({
      gender: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid birth date in the past", () => {
    const result = updateProfileSchema.safeParse({
      birthDate: "1990-01-15",
    });
    expect(result.success).toBe(true);
  });

  it("should reject future birth date", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const result = updateProfileSchema.safeParse({
      birthDate: futureDate.toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid birth date string", () => {
    const result = updateProfileSchema.safeParse({
      birthDate: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("should accept empty birthDate string", () => {
    const result = updateProfileSchema.safeParse({
      birthDate: "",
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid prefecture", () => {
    const result = updateProfileSchema.safeParse({
      prefecture: "東京都",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid prefecture", () => {
    const result = updateProfileSchema.safeParse({
      prefecture: "InvalidPrefecture",
    });
    expect(result.success).toBe(false);
  });

  it("should accept empty prefecture string", () => {
    const result = updateProfileSchema.safeParse({
      prefecture: "",
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid website URL", () => {
    const result = updateProfileSchema.safeParse({
      websiteUrl: "https://example.com",
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty websiteUrl string", () => {
    const result = updateProfileSchema.safeParse({
      websiteUrl: "",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid websiteUrl", () => {
    const result = updateProfileSchema.safeParse({
      websiteUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid avatar URL", () => {
    const result = updateProfileSchema.safeParse({
      avatarUrl: "https://example.com/avatar.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty avatarUrl string", () => {
    const result = updateProfileSchema.safeParse({
      avatarUrl: "",
    });
    expect(result.success).toBe(true);
  });
});
