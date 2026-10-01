/**
 * Cross-platform UUID v4 generator
 * Works in both secure contexts (HTTPS, localhost) and insecure contexts (HTTP on LAN IP e.g. 192.168.x.x)
 */
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback using crypto.getRandomValues if available
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10xx
    return Array.from(bytes)
      .map((b, i) =>
        (i === 4 || i === 6 || i === 8 || i === 10 ? '-' : '') +
        b.toString(16).padStart(2, '0')
      )
      .join('');
  }

  // Pure Math.random fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
