import { rejectOutliersIQR, rejectOutliersZScore } from "../src/utils/calculationUtils";

describe("Outlier rejection functions", () => {

  describe("rejectOutliers IQR", () => {
    it("removes outliers correctly", () => {
      const arr = new Float32Array([1, 2, 2, 2, 3, 100]);
      const result = rejectOutliersIQR(arr);
      
      expect(Array.from(result.ndviArray)).toEqual([1, 2, 2, 2, 3]);
      expect(result.fraction).toBeCloseTo(5 / 6 * 100);
    });

    it("keeps all values if no outliers", () => {
      const arr = new Float32Array([1, 2, 2, 2, 3, 3, 4, 5]);
      const result = rejectOutliersIQR(arr);
      expect(Array.from(result.ndviArray)).toEqual([1, 2, 2, 2, 3, 3, 4, 5]);
      expect(result.fraction).toBe(100);
    });

    it("handles NaNs correctly", () => {
      const arr = new Float32Array([1, 2, NaN, 2, 3, NaN, 100, 5]);
      const result = rejectOutliersIQR(arr);

      expect(Array.from(result.ndviArray)).toEqual([1, 2, 2, 3, 5]);
      expect(result.fraction).toBeCloseTo(5 / 8 * 100);
    });

    it("works with all identical values", () => {
      const arr = new Float32Array([2, 2, 2, 2]);
      const result = rejectOutliersIQR(arr);

      expect(Array.from(result.ndviArray)).toEqual([2, 2, 2, 2]);
      expect(result.fraction).toBe(100);
    });

    it("works with empty array", () => {
      const arr = new Float32Array([]);
      const result = rejectOutliersIQR(arr);

      expect(result.ndviArray.length).toBe(0);
      expect(result.fraction).toBe(0);
    });
  });

  describe("rejectOutliers ZScore", () => {
    it("removes outliers correctly", () => {
      const arr = new Float32Array([1, 2, 2, 2, 3, 100]);
      const result = rejectOutliersZScore(arr, 2); // 2 std dev threshold

      expect(Array.from(result.ndviArray)).toEqual([1, 2, 2, 2, 3]);
      expect(result.fraction).toBeCloseTo(5 / 6 * 100);
    });

    it("keeps all values if no outliers", () => {
      const arr = new Float32Array([1, 2, 2, 2, 3, 3, 4, 5]);
      const result = rejectOutliersZScore(arr);
      expect(Array.from(result.ndviArray)).toEqual([1, 2, 2, 2, 3, 3, 4, 5]);
      expect(result.fraction).toBe(100);
    });

    it("handles NaNs correctly", () => {
      const arr = new Float32Array([1, 2, NaN, 2, 3, NaN, 100, 5]);
      const result = rejectOutliersZScore(arr);

      expect(Array.from(result.ndviArray)).toEqual([1, 2, 2, 3, 5]);
      expect(result.fraction).toBeCloseTo(5 / 8 * 100);
    });

    it("works with all identical values", () => {
      const arr = new Float32Array([2, 2, 2, 2]);
      const result = rejectOutliersZScore(arr);

      expect(Array.from(result.ndviArray)).toEqual([2, 2, 2, 2]);
      expect(result.fraction).toBe(100);
    });

    it("works with empty array", () => {
      const arr = new Float32Array([]);
      const result = rejectOutliersZScore(arr);

      expect(result.ndviArray.length).toBe(0);
      expect(result.fraction).toBe(0);
    });
  });

});
