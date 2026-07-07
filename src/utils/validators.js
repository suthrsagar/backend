/**
 * Simple validators for Advocate E-Diary inputs
 */

export const isEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const isISO8601 = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
};

export const isPhoneNumber = (phone) => {
  // Simple phone check: digits, optional +, spaces, hyphens, parentheses, length 7-15
  const re = /^[\d\s()+-]{7,15}$/;
  return re.test(String(phone));
};
