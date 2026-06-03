import { describe, it, expect } from "vitest";
import {
  weightedAverage,
  totalCfu,
  lodeCount,
  graduationBase,
  formatVoto,
} from "@/lib/libretto";

describe("libretto", () => {
  it("weightedAverage returns 0 for empty list", () => {
    expect(weightedAverage([])).toBe(0);
  });

  it("weightedAverage weights by CFU", () => {
    expect(
      weightedAverage([
        { voto: 30, lode: false, cfu: 6 },
        { voto: 24, lode: false, cfu: 12 },
      ]),
    ).toBe(26);
  });

  it("weightedAverage rounds to two decimals", () => {
    expect(
      weightedAverage([
        { voto: 28, lode: false, cfu: 9 },
        { voto: 30, lode: true, cfu: 6 },
      ]),
    ).toBe(28.8);
  });

  it("totalCfu sums credits", () => {
    expect(
      totalCfu([
        { voto: 30, lode: false, cfu: 6 },
        { voto: 27, lode: false, cfu: 9 },
      ]),
    ).toBe(15);
  });

  it("lodeCount counts only honors entries", () => {
    expect(
      lodeCount([
        { voto: 100, lode: true, cfu: 6 },
        { voto: 100, lode: false, cfu: 6 },
        { voto: 100, lode: true, cfu: 6 },
      ]),
    ).toBe(2);
  });

  it("graduationBase converts media on /110 scale", () => {
    expect(
      graduationBase([
        { voto: 100, lode: false, cfu: 6 },
        { voto: 80, lode: false, cfu: 12 },
      ]),
    ).toBe(95.33);
  });

  it("formatVoto renders 100L only when lode and voto=100", () => {
    expect(formatVoto(100, true)).toBe("100L");
    expect(formatVoto(100, false)).toBe("100");
    expect(formatVoto(90, true)).toBe("90");
  });
});
