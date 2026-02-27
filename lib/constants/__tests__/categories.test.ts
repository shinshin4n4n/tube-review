import { describe, it, expect } from "vitest";
import {
  CATEGORIES,
  getCategoryBySlug,
  getAllCategorySlugs,
} from "../categories";

describe("CATEGORIES", () => {
  it("should have at least one category", () => {
    expect(CATEGORIES.length).toBeGreaterThan(0);
  });

  it("should have unique slugs", () => {
    const slugs = CATEGORIES.map((c) => c.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it("should have required properties for each category", () => {
    for (const cat of CATEGORIES) {
      expect(cat.slug).toBeDefined();
      expect(cat.name).toBeDefined();
      expect(cat.icon).toBeDefined();
      expect(cat.description).toBeDefined();
    }
  });
});

describe("getCategoryBySlug", () => {
  it("should return category for valid slug", () => {
    const category = getCategoryBySlug("gaming");
    expect(category).toBeDefined();
    expect(category?.name).toBe("ゲーム");
  });

  it("should return undefined for invalid slug", () => {
    expect(getCategoryBySlug("nonexistent")).toBeUndefined();
  });

  it("should return undefined for empty string", () => {
    expect(getCategoryBySlug("")).toBeUndefined();
  });
});

describe("getAllCategorySlugs", () => {
  it("should return all category slugs", () => {
    const slugs = getAllCategorySlugs();
    expect(slugs.length).toBe(CATEGORIES.length);
  });

  it("should include known slugs", () => {
    const slugs = getAllCategorySlugs();
    expect(slugs).toContain("entertainment");
    expect(slugs).toContain("gaming");
    expect(slugs).toContain("music");
  });

  it("should return strings only", () => {
    const slugs = getAllCategorySlugs();
    for (const slug of slugs) {
      expect(typeof slug).toBe("string");
    }
  });
});
