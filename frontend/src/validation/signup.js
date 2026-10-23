export function validateSignup(data) {
  const errors = {};
  if (data.name.trim().length < 2 || data.name.trim().length > 80) errors.name = 'Enter a name between 2 and 80 characters.';
  if (data.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = 'Enter a valid email address.';
  if (data.password.length < 12 || data.password.length > 128) errors.password = 'Use a password between 12 and 128 characters.';
  if (data.confirmPassword !== data.password) errors.confirmPassword = 'Passwords must match.';
  if (!data.acceptTerms) errors.acceptTerms = 'Accept the terms to create an account.';
  return errors;
}
