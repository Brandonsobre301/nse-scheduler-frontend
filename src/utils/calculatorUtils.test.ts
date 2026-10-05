// src/utils/calculatorUtils.test.ts
import { calculateDuration, calculateManpower } from './calculatorUtils';

// ---------------------------------------------------------------------------
// calculateDuration
// ---------------------------------------------------------------------------

describe('calculateDuration', () => {

  // --- Nominal cases --------------------------------------------------------

  test('nominal: H=2000, M=5, E=0.8 → duration=12.5w, expendedHours=2500h', () => {
    // MW=50, IW=10, RD=12.5, EH=12.5×5×40=2500
    const result = calculateDuration({ totalManHours: 2000, desiredManPower: 5, efficiency: 0.8 });
    expect(result.duration).toBeCloseTo(12.5);
    expect(result.expendedHours).toBeCloseTo(2500);
  });

  test('nominal: H=40, M=1, E=1.0 → duration=1.0w, expendedHours=40h', () => {
    // MW=1, IW=1, RD=1, EH=1×1×40=40
    const result = calculateDuration({ totalManHours: 40, desiredManPower: 1, efficiency: 1.0 });
    expect(result.duration).toBeCloseTo(1.0);
    expect(result.expendedHours).toBeCloseTo(40);
  });

  test('nominal: H=1600, M=4, E=1.0 → duration=10.0w, expendedHours=1600h', () => {
    // MW=40, IW=10, RD=10, EH=10×4×40=1600
    const result = calculateDuration({ totalManHours: 1600, desiredManPower: 4, efficiency: 1.0 });
    expect(result.duration).toBeCloseTo(10.0);
    expect(result.expendedHours).toBeCloseTo(1600);
  });

  // --- Efficiency inflation -------------------------------------------------

  test('E=0.5 doubles duration compared to E=1.0 (same H and M)', () => {
    const full = calculateDuration({ totalManHours: 800, desiredManPower: 4, efficiency: 1.0 });
    const half = calculateDuration({ totalManHours: 800, desiredManPower: 4, efficiency: 0.5 });
    expect(half.duration).toBeCloseTo(full.duration * 2);
  });

  test('lower efficiency proportionally inflates expended hours', () => {
    const e1 = calculateDuration({ totalManHours: 400, desiredManPower: 2, efficiency: 1.0 });
    const e08 = calculateDuration({ totalManHours: 400, desiredManPower: 2, efficiency: 0.8 });
    // EH = RD × M × 40 and RD = (H/40/M) / E, so EH = H / E
    expect(e08.expendedHours).toBeCloseTo(e1.expendedHours / 0.8);
  });

  test('non-integer manpower (M=2.5) is accepted and computes correctly', () => {
    // MW=20, IW=20/2.5=8, RD=8/0.8=10, EH=10×2.5×40=1000
    const result = calculateDuration({ totalManHours: 800, desiredManPower: 2.5, efficiency: 0.8 });
    expect(result.duration).toBeCloseTo(10);
    expect(result.expendedHours).toBeCloseTo(1000);
  });

  // --- Input guards ---------------------------------------------------------

  test('guard: H=0 → {duration:0, expendedHours:0}', () => {
    const result = calculateDuration({ totalManHours: 0, desiredManPower: 5, efficiency: 0.8 });
    expect(result).toEqual({ duration: 0, expendedHours: 0 });
  });

  test('guard: M=0 → {duration:0, expendedHours:0}', () => {
    const result = calculateDuration({ totalManHours: 2000, desiredManPower: 0, efficiency: 0.8 });
    expect(result).toEqual({ duration: 0, expendedHours: 0 });
  });

  test('guard: E=0 → {duration:0, expendedHours:0}', () => {
    const result = calculateDuration({ totalManHours: 2000, desiredManPower: 5, efficiency: 0 });
    expect(result).toEqual({ duration: 0, expendedHours: 0 });
  });

  test('guard: negative H → {duration:0, expendedHours:0}', () => {
    const result = calculateDuration({ totalManHours: -100, desiredManPower: 5, efficiency: 0.8 });
    expect(result).toEqual({ duration: 0, expendedHours: 0 });
  });

  // --- Efficiency clamping --------------------------------------------------

  test('E>1 is clamped to 1.0 — result matches E=1.0 exactly', () => {
    const clamped = calculateDuration({ totalManHours: 400, desiredManPower: 2, efficiency: 1.5 });
    const baseline = calculateDuration({ totalManHours: 400, desiredManPower: 2, efficiency: 1.0 });
    expect(clamped.duration).toBeCloseTo(baseline.duration);
    expect(clamped.expendedHours).toBeCloseTo(baseline.expendedHours);
  });

  test('E<0 is clamped to 0, which triggers the guard → zeros', () => {
    const result = calculateDuration({ totalManHours: 2000, desiredManPower: 5, efficiency: -0.1 });
    expect(result).toEqual({ duration: 0, expendedHours: 0 });
  });

  test('E=NaN is treated as 0, triggering the guard → zeros', () => {
    const result = calculateDuration({ totalManHours: 2000, desiredManPower: 5, efficiency: NaN });
    expect(result).toEqual({ duration: 0, expendedHours: 0 });
  });

  // --- Numeric coercion -----------------------------------------------------

  test('string-typed numeric inputs are coerced correctly', () => {
    // Simulates <input> values arriving as strings
    const result = calculateDuration({
      totalManHours: '2000' as unknown as number,
      desiredManPower: '5' as unknown as number,
      efficiency: '0.8' as unknown as number,
    });
    expect(result.duration).toBeCloseTo(12.5);
    expect(result.expendedHours).toBeCloseTo(2500);
  });

  test('non-numeric string inputs fall back to 0 → guard returns zeros', () => {
    const result = calculateDuration({
      totalManHours: 'abc' as unknown as number,
      desiredManPower: 5,
      efficiency: 0.8,
    });
    expect(result).toEqual({ duration: 0, expendedHours: 0 });
  });
});

// ---------------------------------------------------------------------------
// calculateManpower
// ---------------------------------------------------------------------------

describe('calculateManpower', () => {

  // --- Nominal cases --------------------------------------------------------

  test('nominal: H=2000, T=10, E=0.8 → recommendedManpower=6.25', () => {
    // MW=50, EW=10×0.8=8, MP=50/8=6.25
    const result = calculateManpower({ totalManHours: 2000, targetDurationWeeks: 10, efficiency: 0.8 });
    expect(result.recommendedManpower).toBeCloseTo(6.25);
  });

  test('nominal: H=1000, T=5, E=1.0 → recommendedManpower=5.0', () => {
    // MW=25, EW=5, MP=5
    const result = calculateManpower({ totalManHours: 1000, targetDurationWeeks: 5, efficiency: 1.0 });
    expect(result.recommendedManpower).toBeCloseTo(5.0);
  });

  test('fractional result: H=100, T=3, E=0.75 → recommendedManpower≈1.111', () => {
    // MW=2.5, EW=3×0.75=2.25, MP=2.5/2.25≈1.1111
    const result = calculateManpower({ totalManHours: 100, targetDurationWeeks: 3, efficiency: 0.75 });
    expect(result.recommendedManpower).toBeCloseTo(100 / 40 / (3 * 0.75));
  });

  test('lower efficiency requires proportionally more workers', () => {
    const e1 = calculateManpower({ totalManHours: 800, targetDurationWeeks: 4, efficiency: 1.0 });
    const e05 = calculateManpower({ totalManHours: 800, targetDurationWeeks: 4, efficiency: 0.5 });
    expect(e05.recommendedManpower).toBeCloseTo(e1.recommendedManpower * 2);
  });

  // --- Input guards ---------------------------------------------------------

  test('guard: H=0 → {recommendedManpower:0}', () => {
    const result = calculateManpower({ totalManHours: 0, targetDurationWeeks: 10, efficiency: 0.8 });
    expect(result).toEqual({ recommendedManpower: 0 });
  });

  test('guard: T=0 → {recommendedManpower:0}', () => {
    const result = calculateManpower({ totalManHours: 2000, targetDurationWeeks: 0, efficiency: 0.8 });
    expect(result).toEqual({ recommendedManpower: 0 });
  });

  test('guard: E=0 → {recommendedManpower:0}', () => {
    const result = calculateManpower({ totalManHours: 2000, targetDurationWeeks: 10, efficiency: 0 });
    expect(result).toEqual({ recommendedManpower: 0 });
  });

  test('guard: negative H → {recommendedManpower:0}', () => {
    const result = calculateManpower({ totalManHours: -500, targetDurationWeeks: 10, efficiency: 0.8 });
    expect(result).toEqual({ recommendedManpower: 0 });
  });

  test('guard: negative T → {recommendedManpower:0}', () => {
    const result = calculateManpower({ totalManHours: 2000, targetDurationWeeks: -5, efficiency: 0.8 });
    expect(result).toEqual({ recommendedManpower: 0 });
  });

  // --- Efficiency clamping --------------------------------------------------

  test('E>1 is clamped to 1.0 — result matches E=1.0 exactly', () => {
    const clamped = calculateManpower({ totalManHours: 800, targetDurationWeeks: 5, efficiency: 2.0 });
    const baseline = calculateManpower({ totalManHours: 800, targetDurationWeeks: 5, efficiency: 1.0 });
    expect(clamped.recommendedManpower).toBeCloseTo(baseline.recommendedManpower);
  });

  test('E<0 is clamped to 0, triggering the guard → zero', () => {
    const result = calculateManpower({ totalManHours: 2000, targetDurationWeeks: 10, efficiency: -0.5 });
    expect(result).toEqual({ recommendedManpower: 0 });
  });

  test('E=NaN is treated as 0, triggering the guard → zero', () => {
    const result = calculateManpower({ totalManHours: 2000, targetDurationWeeks: 10, efficiency: NaN });
    expect(result).toEqual({ recommendedManpower: 0 });
  });

  // --- Numeric coercion -----------------------------------------------------

  test('string-typed numeric inputs are coerced correctly', () => {
    const result = calculateManpower({
      totalManHours: '2000' as unknown as number,
      targetDurationWeeks: '10' as unknown as number,
      efficiency: '0.8' as unknown as number,
    });
    expect(result.recommendedManpower).toBeCloseTo(6.25);
  });
});
