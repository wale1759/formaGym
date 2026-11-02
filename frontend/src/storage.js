import { products } from './data/products.js';

export function restoreStoredList(key, value) {
  if (!Array.isArray(value)) {
    return null;
  }
  if (key === 'forma-cart') {
    return value.flatMap((entry) => {
      // Migrate bags saved by the earlier array-based implementation.
      const item = Array.isArray(entry)
        ? { name: entry[0], quantity: entry[4], size: entry[5] || 'M' }
        : entry;
      const product = products.find((product) => product.name === item?.name);
      if (
        !product ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 20 ||
        !['S', 'M', 'L', 'XL'].includes(item.size)
      ) {
        return [];
      }
      // Catalog fields replace untrusted saved prices and image paths.
      return [{ ...product, quantity: item.quantity, size: item.size }];
    });
  }
  if (key === 'forma-saved') {
    return value.filter((name) =>
      products.some((product) => product.name === name),
    );
  }
  if (key === 'forma-bookings') {
    return value.filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.item === 'string' &&
        typeof item.date === 'string' &&
        typeof item.time === 'string' &&
        typeof item.waitlist === 'boolean',
    );
  }
  return null;
}
