import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { getLegalInfo } = await import("./legal");

const KEYS = [
  "LEGAL_NAME",
  "LEGAL_ADDRESS",
  "LEGAL_EMAIL",
  "LEGAL_PHONE",
  "LEGAL_NOTE",
  "LEGAL_HOSTING",
  "LEGAL_AUTHORITY",
];

afterEach(() => {
  for (const k of KEYS) delete process.env[k];
});

describe("getLegalInfo", () => {
  it("is off unless name, address and email are set", () => {
    expect(getLegalInfo()).toBeNull();
    process.env.LEGAL_NAME = "Erika Muster";
    process.env.LEGAL_EMAIL = "erika@example.com";
    expect(getLegalInfo()).toBeNull();
  });

  it("splits the address and drops empty optionals", () => {
    process.env.LEGAL_NAME = "Erika Muster";
    process.env.LEGAL_ADDRESS = "Musterweg 1 | 12345 Musterstadt|Deutschland";
    process.env.LEGAL_EMAIL = "erika@example.com";
    process.env.LEGAL_PHONE = "  ";
    expect(getLegalInfo()).toEqual({
      name: "Erika Muster",
      address: ["Musterweg 1", "12345 Musterstadt", "Deutschland"],
      email: "erika@example.com",
      phone: undefined,
      note: undefined,
      hosting: undefined,
      authority: undefined,
    });
  });
});
