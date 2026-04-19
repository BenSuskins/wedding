import { describe, expect, it } from "vitest";

import { escapeCsvField, writeCsv } from "@/lib/csv/serialize";

describe("csv serialization", () => {
  it("leaves plain values unquoted", () => {
    expect(escapeCsvField("plain")).toBe("plain");
    expect(escapeCsvField(42)).toBe("42");
    expect(escapeCsvField(true)).toBe("true");
  });

  it("quotes fields containing separators, quotes, or newlines and doubles embedded quotes", () => {
    expect(escapeCsvField("has, comma")).toBe('"has, comma"');
    expect(escapeCsvField('has "quotes"')).toBe('"has ""quotes"""');
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
    expect(escapeCsvField("line1\r\nline2")).toBe('"line1\r\nline2"');
  });

  it("renders nulls and undefined as empty and formats dates as ISO", () => {
    expect(escapeCsvField(null)).toBe("");
    expect(escapeCsvField(undefined)).toBe("");
    const date = new Date("2026-06-01T12:00:00.000Z");
    expect(escapeCsvField(date)).toBe("2026-06-01T12:00:00.000Z");
  });

  it("writes a header-plus-rows document with CRLF line endings", () => {
    const output = writeCsv(
      ["name", "attending", "notes"],
      [
        ["Alice", true, "peanuts"],
        ["Bob, Jr.", false, 'says "maybe"'],
      ],
    );
    expect(output).toBe(
      [
        "name,attending,notes",
        "Alice,true,peanuts",
        '"Bob, Jr.",false,"says ""maybe"""',
        "",
      ].join("\r\n"),
    );
  });
});
