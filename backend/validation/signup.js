export function validateSignup(input) {
  const data = input && typeof input === 'object' ? input : {};
  const errors = {};
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  if (name.length < 2 || name.length > 80) errors.name = 'Enter a name between 2 and 80 characters.';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
  if (typeof data.password !== 'string' || data.password.length < 12 || data.password.length > 128) errors.password = 'Use a password between 12 and 128 characters.';
  if (typeof data.confirmPassword !== 'string' || data.confirmPassword !== data.password) errors.confirmPassword = 'Passwords must match.';
  if (data.acceptTerms !== true) errors.acceptTerms = 'Accept the terms to create an account.';
  return { errors, value: { name, email, password: data.password } };
}
