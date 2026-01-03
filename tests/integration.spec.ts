import { detectChangePointsZScore } from '../src/utils/calculationUtils';
import { series } from './fixtures';

describe('Integration: pipeline STAC > series > detector > markers', () => {
  it('detects correct number of markers for small fixture', () => {

    const changes = detectChangePointsZScore(series, 3, 2.0);

    expect(changes.length).toBe(3);
    expect(changes[1].id).toBe(7);
    expect(changes[2].id).toBe(13);
  });
});
