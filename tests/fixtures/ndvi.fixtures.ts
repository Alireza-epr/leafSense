import { INDVISample } from "../../src/types";

export const createNDVISample = (
  overrides: Partial<INDVISample> = {}
): INDVISample => ({
  featureId: 'feature-1',
  id: 0,
  datetime: '2025-01-01T00:00:00Z',
  preview: '',
  ndviArray: null,
  meanNDVI: null,
  meanNDVISmoothed: null,
  medianNDVI: null,
  medianNDVISmoothed: null,
  n_valid: 0,
  valid_fraction: 0,
  not_valid_fraction: {
    NO_DATA: 0,
    SATURATED_OR_DEFECTIVE: 0,
    CLOUD_SHADOWS: 0,
    WATER: 0,
    CLOUD_MEDIUM_PROBABILITY: 0,
    CLOUD_HIGH_PROBABILITY: 0,
    THIN_CIRRUS: 0
},
  filter: 'NONE' as any,
  filter_fraction: 0,
  ...overrides,
});

export const makeSamples = (values: number[]): INDVISample[] =>
  values.map((v, i) =>
    createNDVISample({ id: i + 1, meanNDVI: v, datetime: `2025-01-${i + 1}T00:00:00Z` })
);

const makeNDVIPixels = (mean: number) =>
    new Float32Array([
    mean - 0.005,
    mean - 0.004,
    mean - 0.003,
    mean - 0.002,
    mean - 0.001,
    mean + 0.001,
    mean + 0.002,
    mean + 0.003,
    mean + 0.004,
    mean + 0.005,
  ]);

const stacItems = [
  { datetime: '2025-01-01', ndviArray: makeNDVIPixels(0.10) },
  { datetime: '2025-01-02', ndviArray: makeNDVIPixels(0.11) },
  { datetime: '2025-01-03', ndviArray: makeNDVIPixels(0.12) },
  { datetime: '2025-01-04', ndviArray: makeNDVIPixels(0.13) },
  { datetime: '2025-01-05', ndviArray: makeNDVIPixels(0.13) },
  { datetime: '2025-01-06', ndviArray: makeNDVIPixels(0.14) },
  { datetime: '2025-01-07', ndviArray: makeNDVIPixels(0.50) }, // big jump
  { datetime: '2025-01-08', ndviArray: makeNDVIPixels(0.51) },
  { datetime: '2025-01-09', ndviArray: makeNDVIPixels(0.52) },
  { datetime: '2025-01-10', ndviArray: makeNDVIPixels(0.53) },
  { datetime: '2025-01-11', ndviArray: makeNDVIPixels(0.54) },
  { datetime: '2025-01-12', ndviArray: makeNDVIPixels(0.55) },
  { datetime: '2025-01-13', ndviArray: makeNDVIPixels(0.60) }, // smaller jump
  { datetime: '2025-01-14', ndviArray: makeNDVIPixels(0.61) },
  { datetime: '2025-01-15', ndviArray: makeNDVIPixels(0.62) },
];

export const series = stacItems.map((item, i) =>
  createNDVISample({
    id: i + 1,
    datetime: item.datetime + 'T00:00:00Z',
    ndviArray: new Float32Array(item.ndviArray),
    meanNDVI: item.ndviArray.reduce((a,b)=>a+b,0)/item.ndviArray.length,
  })
);
