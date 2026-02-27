import { describe, it, expect } from "vitest";
import {
  isChannelObject,
  isChannelArray,
  extractYoutubeChannelId,
} from "../guards";

describe("isChannelObject", () => {
  it("should return true for object with youtube_channel_id", () => {
    expect(isChannelObject({ youtube_channel_id: "UC123" })).toBe(true);
  });

  it("should return true for object with undefined youtube_channel_id", () => {
    expect(isChannelObject({ youtube_channel_id: undefined })).toBe(true);
  });

  it("should return false for null", () => {
    expect(isChannelObject(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isChannelObject(undefined)).toBe(false);
  });

  it("should return false for string", () => {
    expect(isChannelObject("UC123")).toBe(false);
  });

  it("should return false for empty object", () => {
    expect(isChannelObject({})).toBe(false);
  });

  it("should return false for object without youtube_channel_id", () => {
    expect(isChannelObject({ id: "123", title: "Test" })).toBe(false);
  });
});

describe("isChannelArray", () => {
  it("should return true for non-empty array", () => {
    expect(isChannelArray([{ youtube_channel_id: "UC123" }])).toBe(true);
  });

  it("should return false for empty array", () => {
    expect(isChannelArray([])).toBe(false);
  });

  it("should return false for non-array", () => {
    expect(isChannelArray({ youtube_channel_id: "UC123" })).toBe(false);
  });

  it("should return false for null", () => {
    expect(isChannelArray(null)).toBe(false);
  });

  it("should return false for string", () => {
    expect(isChannelArray("UC123")).toBe(false);
  });
});

describe("extractYoutubeChannelId", () => {
  it("should extract from single object", () => {
    expect(extractYoutubeChannelId({ youtube_channel_id: "UC123" })).toBe(
      "UC123"
    );
  });

  it("should extract from array", () => {
    expect(extractYoutubeChannelId([{ youtube_channel_id: "UC456" }])).toBe(
      "UC456"
    );
  });

  it("should return undefined for null", () => {
    expect(extractYoutubeChannelId(null)).toBeUndefined();
  });

  it("should return undefined for empty array", () => {
    expect(extractYoutubeChannelId([])).toBeUndefined();
  });

  it("should return undefined for non-channel object", () => {
    expect(extractYoutubeChannelId({ id: "123" })).toBeUndefined();
  });

  it("should return undefined for string", () => {
    expect(extractYoutubeChannelId("UC123")).toBeUndefined();
  });

  it("should return first element from array with multiple items", () => {
    expect(
      extractYoutubeChannelId([
        { youtube_channel_id: "UC111" },
        { youtube_channel_id: "UC222" },
      ])
    ).toBe("UC111");
  });
});
