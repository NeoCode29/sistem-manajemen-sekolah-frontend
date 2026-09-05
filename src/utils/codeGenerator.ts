/**
 * Generates a unique code with a specific prefix.
 * Example: generateUniqueCode('JAB') -> 'JAB-A1B2'
 */
export const generateUniqueCode = (prefix: string): string => {
  // Generate a random string of 4 alphanumeric characters
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${randomStr}`;
};
