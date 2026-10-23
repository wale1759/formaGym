export function validateAdministrator(input) {
  const data = input && typeof input === 'object' ? input : {};
  const username = typeof data.username === 'string' ? data.username.trim().toLowerCase() : '';
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const errors = {};
  if (!/^[a-z][a-z0-9_.-]{2,31}$/.test(username)) errors.username = 'Use 3–32 characters, starting with a letter: letters, numbers, dots, underscores or hyphens.';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
  if (typeof data.password !== 'string' || data.password.length < 12 || data.password.length > 128) errors.password = 'Use a password between 12 and 128 characters.';
  if (typeof data.confirmPassword !== 'string' || data.confirmPassword !== data.password) errors.confirmPassword = 'Passwords must match.';
  return { errors, value: { username, email, password: data.password } };
}
