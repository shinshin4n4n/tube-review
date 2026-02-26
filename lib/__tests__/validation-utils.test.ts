import { describe, it, expect } from "vitest";
import { isUUID } from "../validation-utils";

describe("isUUID", () => {
  it("should return true for valid UUID v4", () => {
    expect(isUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("should return true for UUID with uppercase hex", () => {
    expect(isUUID("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
  });

  it("should return true for UUID with mixed case", () => {
    expect(isUUID("550e8400-E29B-41d4-a716-446655440000")).toBe(true);
  });

  it("should return false for YouTube channel ID", () => {
    expect(isUUID("UCXuqSBlHAE6Xw-yeJA0Tunw")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isUUID("")).toBe(false);
  });

  it("should return false for random string", () => {
    expect(isUUID("not-a-uuid")).toBe(false);
  });

  it("should return false for UUID without hyphens", () => {
    expect(isUUID("550e8400e29b41d4a716446655440000")).toBe(false);
  });

  it("should return false for UUID with extra characters", () => {
    expect(isUUID("550e8400-e29b-41d4-a716-446655440000x")).toBe(false);
  });

  it("should return false for UUID with invalid hex characters", () => {
    expect(isUUID("550g8400-e29b-41d4-a716-446655440000")).toBe(false);
  });

  it("should return false for partial UUID", () => {
    expect(isUUID("550e8400-e29b-41d4")).toBe(false);
  });
});
