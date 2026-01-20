/**
 * Type guard utilities for Express route parameters
 * Ensures req.params values are properly typed as strings
 */

/**
 * Ensures a route parameter is a string (not string[])
 * Throws 400 error if param is an array or undefined
 */
export function ensureString(
  value: string | string[] | undefined,
  paramName: string
): string {
  if (Array.isArray(value)) {
    throw new Error(`Parameter ${paramName} must be a single value, not an array`);
  }
  if (!value) {
    throw new Error(`Parameter ${paramName} is required`);
  }
  return value;
}

/**
 * Safely gets a string parameter from req.params
 * Returns the first element if it's an array
 */
export function getParamAsString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value || '';
}
