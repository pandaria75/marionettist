export const gatePolicyDefaultModeValues = new Set(["strict", "balanced", "autonomous"]);

export function normalizeGatePolicyDefaultMode(value, label = "gate policy default mode") {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (!gatePolicyDefaultModeValues.has(normalized)) {
    throw new Error(`Unsupported ${label}: ${value}. Expected strict, balanced, or autonomous.`);
  }

  return normalized;
}

export function validateOptionalGatePolicyDefaultMode(value, label = "gate policy default mode") {
  if (value === undefined || value === null || value === "") {
    return {
      value: null,
      error: null,
      rawValue: value
    };
  }

  if (typeof value !== "string") {
    return {
      value: null,
      error: `${label} invalid: expected string strict|balanced|autonomous, got ${typeof value}`,
      rawValue: value
    };
  }

  try {
    return {
      value: normalizeGatePolicyDefaultMode(value, label),
      error: null,
      rawValue: value
    };
  } catch (error) {
    return {
      value: null,
      error: error instanceof Error ? error.message : String(error),
      rawValue: value
    };
  }
}
