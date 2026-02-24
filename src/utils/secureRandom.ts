import { UTILITY_ERRORS } from '@/utils/errorMessages';

const TWO_POW_32 = 0x100000000;

const getCrypto = (): Crypto | null => {
  if (typeof globalThis === 'undefined') {
    return null;
  }

  const crypto =
    globalThis.crypto ??
    (globalThis as typeof globalThis & { msCrypto?: Crypto }).msCrypto;

  if (crypto && typeof crypto.getRandomValues === 'function') {
    return crypto;
  }

  return null;
};

const getRandomUint32 = (): number => {
  const crypto = getCrypto();
  if (!crypto) {
    throw new Error(UTILITY_ERRORS.SECURE_RANDOM_UNAVAILABLE);
  }

  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const value = array[0];
  if (value === undefined) {
    throw new Error(UTILITY_ERRORS.SECURE_RANDOM_GENERATION_FAILED);
  }
  return value;
};

export const secureRandomFraction = (): number => {
  return getRandomUint32() / TWO_POW_32;
};

export const secureRandomInt = (max: number): number => {
  const safeMax = Math.max(0, Math.floor(max));
  if (safeMax === 0) {
    return 0;
  }

  return Math.floor(secureRandomFraction() * safeMax);
};

export const secureRandomInRange = (min: number, max: number): number => {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  if (upper === lower) {
    return lower;
  }

  const range = upper - lower;
  return lower + secureRandomInt(range);
};

export const pickSecureRandomElement = <T>(items: T[]): T | undefined => {
  if (items.length === 0) {
    return undefined;
  }

  return items[secureRandomInt(items.length)];
};

export const secureRandomChance = (threshold: number): boolean => {
  if (threshold <= 0) return false;
  if (threshold >= 1) return true;
  return secureRandomFraction() < threshold;
};

export const secureRandomId = (): string => {
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto?.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `id-${Date.now()}-${secureRandomInt(1_000_000)}`;
};
