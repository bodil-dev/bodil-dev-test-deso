import { DeSOFinder } from './deso-finder';

let DESO_FINDER: DeSOFinder;

beforeAll(async () => {
  DESO_FINDER = await DeSOFinder.open();
});

afterAll(() => {
  DESO_FINDER.close();
});

describe('DeSOFinder.find', () => {
  it.each`
    lat         | lng         | deso
    ${56.28469} | ${13.32955} | ${'1257C1010'}
  `('finds $deso at [$lat, $lng]', ({ lat, lng, deso }) => {
    const actual = DESO_FINDER.find(lat, lng);

    expect(actual).not.toBeUndefined();
    expect(actual?.deso).toEqual(deso);
  });

  it('returns undefined outside Sweden', () => {
    // Coordinates of S:t Bodil's Church on Bornholm, which is outside Sweden, for now.
    expect(DESO_FINDER.find(55.0618, 15.07273)).toBeUndefined();
  });
});
