/**
 * Helper utilities for sanitizing inputs and preventing whitespace-only payloads.
 */

/**
 * Returns true if the value is a string that only contains whitespace/spaces.
 */
export function isWhitespaceOnly(val: unknown): boolean {
  return typeof val === 'string' && val.length > 0 && val.trim().length === 0;
}

/**
 * Recursively trims all string fields in an object or array,
 * excluding specific sensitive fields (e.g. passwords).
 */
export function trimPayload<T>(
  data: T,
  excludedKeys: string[] = ['password', 'confirmPassword', 'oldPassword', 'newPassword', 'currentPassword']
): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return data.trim() as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => trimPayload(item, excludedKeys)) as unknown as T;
  }

  if (typeof data === 'object' && !(data instanceof Date) && !(data instanceof File) && !(data instanceof Blob)) {
    const excludedSet = new Set(excludedKeys);
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (excludedSet.has(key)) {
        result[key] = value;
      } else {
        result[key] = trimPayload(value, excludedKeys);
      }
    }

    return result as T;
  }

  return data;
}
