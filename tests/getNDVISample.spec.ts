jest.mock("geotiff", () => ({
  fromUrl: jest.fn(),
  GeoTIFFImage: jest.fn(),
})); // Provide mock functions for any code that imports `geotiff`

import { getNDVISample } from "../src/utils/geoTiffUtils";

describe("Get NDVI Sample", () => {
  const red = new Float32Array([0.2, 0.2, 0.2, 0.2]);

  const nir = new Float32Array([0.6, 0.6, 0.6, 0.6]);

  const scl = new Uint8Array([
    0, // NO_DATA
    9, // CLOUD_HIGH_PROBABILITY
    4, // GOOD pixel
    4, // GOOD pixel
  ]);

  const redRaster = { width: 2, height: 2, 0: red } as any;
  const nirRaster = { width: 2, height: 2, 0: nir } as any;
  const sclRaster = { width: 2, height: 2, 0: scl } as any;

  const feature = {
    id: "test-feature",
    properties: { datetime: "2024-01-01T00:00:00Z" },
    assets: { rendered_preview: { href: "preview.png" } },
  } as any;
  it("calculates NDVI and excludes bad pixels correctly", () => {
    const panel = {
      coverageThreshold: 40,
      filter: "NONE",
    } as any;

    const result = getNDVISample(
      1,
      redRaster,
      nirRaster,
      sclRaster,
      panel,
      feature,
    );

    if (!result.ndviArray) {
      throw new Error("result.ndviArray not defined");
    }

    // NDVI length
    expect(result.ndviArray.length).toBe(4);

    // Bad pixels become NaN
    expect(result.ndviArray[0]).toBeNaN();
    expect(result.ndviArray[1]).toBeNaN();

    // NDVI formula: (0.6 - 0.2) / (0.6 + 0.2) = 0.5
    expect(result.ndviArray[2]).toBeCloseTo(0.5);
    expect(result.ndviArray[3]).toBeCloseTo(0.5);

    // Coverage
    expect(result.n_valid).toBe(2);
    expect(result.valid_fraction).toBeCloseTo(50);
  });
  it("rejects scene when valid pixel coverage is below threshold", () => {
    const panelHighCoverage = {
      coverageThreshold: 80,
      filter: "NONE",
    } as any;

    expect(() =>
      getNDVISample(
        1,
        redRaster,
        nirRaster,
        sclRaster,
        panelHighCoverage,
        feature,
      ),
    ).toThrow("Scene rejected");
  });
});
