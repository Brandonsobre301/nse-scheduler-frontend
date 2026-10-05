// src/utils/calculatorUtils.ts

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface DurationInputs {
  /** Total budgeted man-hours for the project. Must be > 0. */
  totalManHours: number;
  /** Number of workers assigned to the project. Must be > 0. */
  desiredManPower: number;
  /**
   * Team efficiency as a decimal (0.0–1.0).
   * Values outside this range are clamped before use.
   * E = 0 causes the guard to trigger and returns zero outputs.
   */
  efficiency: number;
}

export interface ManpowerInputs {
  /** Total budgeted man-hours for the project. Must be > 0. */
  totalManHours: number;
  /** Target project duration in weeks. Must be > 0. */
  targetDurationWeeks: number;
  /**
   * Team efficiency as a decimal (0.0–1.0).
   * Values outside this range are clamped before use.
   * E = 0 causes the guard to trigger and returns zero output.
   */
  efficiency: number;
}

export interface DurationOutputs {
  /** Realistic project duration in weeks. */
  duration: number;
  /** Total hours expended under these conditions. */
  expendedHours: number;
}

export interface ManpowerOutputs {
  /** Required number of workers (may be fractional — round up in practice). */
  recommendedManpower: number;
}

// ---------------------------------------------------------------------------
// calculateDuration
// ---------------------------------------------------------------------------

/**
 * Calculates realistic project duration and total expended hours given a
 * fixed crew size and efficiency factor.
 *
 * **Formulas**
 * ```
 * MW  = H / 40          // Man-Weeks (converting hours → weeks at 40 h/wk)
 * IW  = MW / M          // Ideal Weeks (assuming 100% efficiency)
 * RD  = IW / E          // Realistic Duration (inflated by efficiency < 1)
 * EH  = RD × M × 40    // Expended Hours
 * ```
 *
 * **Units**
 * - `totalManHours`  — hours
 * - `desiredManPower` — persons
 * - `efficiency`      — dimensionless (0.0–1.0); clamped automatically
 * - `duration`        — weeks
 * - `expendedHours`   — hours
 *
 * **Guards** — returns `{ duration: 0, expendedHours: 0 }` if any of:
 * - `totalManHours ≤ 0`
 * - `desiredManPower ≤ 0`
 * - effective `efficiency ≤ 0` (after clamping)
 */
export function calculateDuration(inputs: DurationInputs): DurationOutputs {
  const H = Number(inputs.totalManHours) || 0;
  const M = Number(inputs.desiredManPower) || 0;
  let E = Number(inputs.efficiency);

  if (isNaN(E)) E = 0;
  E = Math.max(0, Math.min(1, E)); // clamp to [0, 1]

  if (H <= 0 || M <= 0 || E <= 0) {
    return { duration: 0, expendedHours: 0 };
  }

  const MW = H / 40;        // Man-Weeks
  const IW = MW / M;        // Ideal Weeks
  const RD = IW / E;        // Realistic Duration (weeks)
  const EH = RD * M * 40;   // Expended Hours

  return { duration: RD, expendedHours: EH };
}

// ---------------------------------------------------------------------------
// calculateManpower
// ---------------------------------------------------------------------------

/**
 * Calculates the required crew size to complete a project within a target
 * duration, accounting for efficiency losses.
 *
 * **Formulas**
 * ```
 * MW  = H / 40      // Man-Weeks
 * EW  = T × E       // Effective Weeks (target shrunk by efficiency)
 * MP  = MW / EW     // Required Manpower
 * ```
 *
 * **Units**
 * - `totalManHours`       — hours
 * - `targetDurationWeeks` — weeks
 * - `efficiency`          — dimensionless (0.0–1.0); clamped automatically
 * - `recommendedManpower` — persons (fractional; round up for scheduling)
 *
 * **Guards** — returns `{ recommendedManpower: 0 }` if any of:
 * - `totalManHours ≤ 0`
 * - `targetDurationWeeks ≤ 0`
 * - effective `efficiency ≤ 0` (after clamping)
 */
export function calculateManpower(inputs: ManpowerInputs): ManpowerOutputs {
  const H = Number(inputs.totalManHours) || 0;
  const T = Number(inputs.targetDurationWeeks) || 0;
  let E = Number(inputs.efficiency);

  if (isNaN(E)) E = 0;
  E = Math.max(0, Math.min(1, E)); // clamp to [0, 1]

  if (H <= 0 || T <= 0 || E <= 0) {
    return { recommendedManpower: 0 };
  }

  const MW = H / 40;    // Man-Weeks
  const EW = T * E;     // Effective Weeks
  const MP = MW / EW;   // Required Manpower

  return { recommendedManpower: MP };
}
