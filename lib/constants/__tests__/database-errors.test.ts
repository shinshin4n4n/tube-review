import { describe, it, expect } from "vitest";
import { DB_ERROR_CODES, isPostgresError } from "../database-errors";

describe("DB_ERROR_CODES", () => {
  it("should have UNIQUE_VIOLATION code", () => {
    expect(DB_ERROR_CODES.UNIQUE_VIOLATION).toBe("23505");
  });

  it("should have FOREIGN_KEY_VIOLATION code", () => {
    expect(DB_ERROR_CODES.FOREIGN_KEY_VIOLATION).toBe("23503");
  });

  it("should have NOT_NULL_VIOLATION code", () => {
    expect(DB_ERROR_CODES.NOT_NULL_VIOLATION).toBe("23502");
  });

  it("should have CHECK_VIOLATION code", () => {
    expect(DB_ERROR_CODES.CHECK_VIOLATION).toBe("23514");
  });
});

describe("isPostgresError", () => {
  it("should return true for object with string code", () => {
    expect(isPostgresError({ code: "23505" })).toBe(true);
  });

  it("should return true for error-like object with code", () => {
    expect(isPostgresError({ code: "42P01", message: "Table not found" })).toBe(
      true
    );
  });

  it("should return false for null", () => {
    expect(isPostgresError(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isPostgresError(undefined)).toBe(false);
  });

  it("should return false for string", () => {
    expect(isPostgresError("error")).toBe(false);
  });

  it("should return false for number", () => {
    expect(isPostgresError(42)).toBe(false);
  });

  it("should return false for object without code", () => {
    expect(isPostgresError({ message: "error" })).toBe(false);
  });

  it("should return false for object with non-string code", () => {
    expect(isPostgresError({ code: 123 })).toBe(false);
  });
});
