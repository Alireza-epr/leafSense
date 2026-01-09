import { detectChangePointsZScore } from "../src/utils/calculationUtils";
import { makeSamples } from "./fixtures";
import { series } from "./fixtures";

describe("Detect Change Points", () => {
  it("returns empty array for empty input", () => {
    const result = detectChangePointsZScore([]);
    expect(result).toEqual([]);
  });

  it("returns empty array for single sample", () => {
    const samples = makeSamples([0.3]);
    const result = detectChangePointsZScore(samples);
    expect(result).toEqual([]);
  });

  it("returns empty array if no change exceeds threshold", () => {
    const samples = makeSamples([0.1, 0.12, 0.11, 0.13, 0.12, 0.11, 0.1]);
    const result = detectChangePointsZScore(samples, 3, 2.5);
    expect(result).toEqual([]);
  });

  it("detects a single change point", () => {
    const samples = makeSamples([0.1, 0.11, 0.12, 0.09, 1.0, 1.51, 1.52]);
    const result = detectChangePointsZScore(samples, 3, 2.0);
    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({
      id: 5, // sample index +1
      datetime: "2025-01-5T00:00:00Z",
      reason: "z-score",
    });
    expect(result[0].z).toBeGreaterThanOrEqual(2.0);
  });

  it("detects multiple change points respecting min separation", () => {
    const samples = makeSamples([
      0.1, 0.12, 0.11, 0.12, 0.15, 0.14, 0.09, 0.1, 0.5, 0.52, 0.53, 0.2, 0.22,
      0.25,
    ]);
    const result = detectChangePointsZScore(samples, 3, 2.0, 2);
    // Should detect first change at index 6 and second at index 8
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0].id).toBe(7);
    expect(result[1].id).toBe(9);
    expect(result[2].id).toBe(12);
  });

  it("handles identical NDVI values (std=0)", () => {
    const samples = makeSamples([0.2, 0.2, 0.2, 0.2, 0.2, 0.2]);
    const result = detectChangePointsZScore(samples);
    expect(result).toEqual([]);
  });

  it("works with window size larger than deltas array", () => {
    const samples = makeSamples([0.1, 0.2, 0.3]);
    const result = detectChangePointsZScore(samples, 10);
    expect(result).toEqual([]);
  });

  it("calculates z correctly", () => {
    const samples = makeSamples([0.1, 0.2, 0.3, 1.0, 0.4, 0.5, 0.6]);
    const result = detectChangePointsZScore(samples, 3, 1.5);
    expect(Math.abs(result[0].z)).toBeGreaterThanOrEqual(3);
  });

  it("detects correct number of markers for small fixture", () => {
    const changes = detectChangePointsZScore(series, 3, 2.0);

    expect(changes.length).toBe(3);
    expect(changes[1].id).toBe(7);
    expect(changes[2].id).toBe(13);
  });
});
