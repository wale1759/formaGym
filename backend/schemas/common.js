export const text = (maxLength = 200, minLength = 1) => ({ type: 'string', minLength, maxLength });
export const email = { ...text(254), pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' };
export const timestamp = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{3})?Z$' };
export const date = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' };
export const integer = (minimum = 0, maximum = Number.MAX_SAFE_INTEGER) => ({ type: 'number', multipleOf: 1, minimum, maximum });
export const amount = { type: 'number', minimum: 0, maximum: 1000000000 };
export const object = (properties, required = []) => ({ type: 'object', additionalProperties: false, properties, required });
export function document(properties, required = []) {
  return object({ _id: {}, id: text(100), createdAt: timestamp, updatedAt: timestamp, ...properties }, ['id', 'createdAt', 'updatedAt', ...required]);
}
