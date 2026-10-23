export function validateSignin(data) {
  const errors = {};
  if (data.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = 'Enter a valid email address.';
  if (data.password.length < 12 || data.password.length > 128) errors.password = 'Enter your password (12 to 128 characters).';
  return errors;
}
