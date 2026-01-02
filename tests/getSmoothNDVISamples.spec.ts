import { getSmoothNDVISamples } from "../src/utils/calculationUtils"
import { createNDVISample } from "./fixtures"

describe('Get Smoothed Mean/Median NDVI Samples', () => {
  it('returns original samples when window size < 2', () => {
    const samples = [
      createNDVISample({ id: 1, meanNDVI: 0.2 }),
      createNDVISample({ id: 2, meanNDVI: 0.4 }),
    ];

    const result = getSmoothNDVISamples(samples, 1);

    expect(result).toBe(samples); // same reference
  });

  it('smooths mean and median NDVI using default window size (3)', () => {
    const samples = [
      createNDVISample({ id: 1, meanNDVI: 0.2, medianNDVI: 0.2 }),
      createNDVISample({ id: 2, meanNDVI: 0.4, medianNDVI: 0.4 }),
      createNDVISample({ id: 3, meanNDVI: 0.6, medianNDVI: 0.6 }),
    ];

    const result = getSmoothNDVISamples(samples);

    expect(result[0].meanNDVISmoothed).toBeCloseTo((0.2 + 0.4) / 2);
    expect(result[1].meanNDVISmoothed).toBeCloseTo((0.2 + 0.4 + 0.6) / 3);
    expect(result[2].meanNDVISmoothed).toBeCloseTo((0.4 + 0.6) / 2);

    expect(result[1].medianNDVISmoothed).toBeCloseTo(0.4);
  });

  it('handles null values by ignoring them in the window', () => {
    const samples = [
      createNDVISample({ id: 1, meanNDVI: null }),
      createNDVISample({ id: 2, meanNDVI: 0.4 }),
      createNDVISample({ id: 3, meanNDVI: null }),
    ];

    const result = getSmoothNDVISamples(samples);

    expect(result[0].meanNDVISmoothed).toBe(0.4);
    expect(result[1].meanNDVISmoothed).toBe(0.4);
    expect(result[2].meanNDVISmoothed).toBe(0.4);
  });

  it('falls back to original value if all window values are null', () => {
    const samples = [
      createNDVISample({ id: 1, meanNDVI: null }),
      createNDVISample({ id: 2, meanNDVI: null }),
      createNDVISample({ id: 3, meanNDVI: null }),
    ];

    const result = getSmoothNDVISamples(samples);

    expect(result[1].meanNDVISmoothed).toBeNull();
  });

  it('does not mutate original samples', () => {
    const samples = [
      createNDVISample({ id: 1, meanNDVI: 0.3 }),
      createNDVISample({ id: 2, meanNDVI: 0.5 }),
    ];

    const original = JSON.parse(JSON.stringify(samples));

    getSmoothNDVISamples(samples);

    expect(samples).toEqual(original);
  });

  it('works with custom window size', () => {
    const samples = [
      createNDVISample({ meanNDVI: 0.1 }),
      createNDVISample({ meanNDVI: 0.2 }),
      createNDVISample({ meanNDVI: 0.3 }),
      createNDVISample({ meanNDVI: 0.4 }),
      createNDVISample({ meanNDVI: 0.5 }),
    ];

    const result = getSmoothNDVISamples(samples, 5);

    expect(result[2].meanNDVISmoothed).toBeCloseTo(
      (0.1 + 0.2 + 0.3 + 0.4 + 0.5) / 5
    );
  });
});