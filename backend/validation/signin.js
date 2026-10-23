export function validateSignin(input) {
  const data = input && typeof input === 'object' ? input : {};
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const errors = {};
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
  if (typeof data.password !== 'string' || data.password.length < 12 || data.password.length > 128) errors.password = 'Enter your password (12 to 128 characters).';
  return { errors, value: { email, password: data.password } };
}
