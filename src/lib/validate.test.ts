import { describe, it, expect } from 'vitest';
import {
  isNonEmptyString,
  isString,
  isNumber,
  isInteger,
  isBoolean,
  isOneOf,
  isValidDate,
  isValidEmail,
  isValidUUID,
  isObject,
} from '../../supabase/functions/_shared/validate';

describe('isNonEmptyString', () => {
  it('accepts non-empty strings', () => {
    expect(isNonEmptyString('hello')).toBe(true);
    expect(isNonEmptyString(' x ')).toBe(true);
  });
  it('rejects empty or whitespace-only strings', () => {
    expect(isNonEmptyString('')).toBe(false);
    expect(isNonEmptyString('   ')).toBe(false);
  });
  it('rejects non-strings', () => {
    expect(isNonEmptyString(42)).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
  });
});

describe('isNumber', () => {
  it('accepts finite numbers', () => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(-1.5)).toBe(true);
    expect(isNumber(42)).toBe(true);
  });
  it('rejects NaN and non-numbers', () => {
    expect(isNumber(NaN)).toBe(false);
    expect(isNumber('42')).toBe(false);
    expect(isNumber(null)).toBe(false);
  });
});

describe('isInteger', () => {
  it('accepts integers', () => {
    expect(isInteger(0)).toBe(true);
    expect(isInteger(42)).toBe(true);
    expect(isInteger(-7)).toBe(true);
  });
  it('rejects floats', () => {
    expect(isInteger(3.14)).toBe(false);
  });
});

describe('isOneOf', () => {
  const allowed = ['apple', 'banana', 'cherry'] as const;
  it('accepts values in the allowed list', () => {
    expect(isOneOf('apple', allowed)).toBe(true);
    expect(isOneOf('cherry', allowed)).toBe(true);
  });
  it('rejects values not in the list', () => {
    expect(isOneOf('grape', allowed)).toBe(false);
    expect(isOneOf('', allowed)).toBe(false);
  });
});

describe('isValidDate', () => {
  it('accepts ISO date strings', () => {
    expect(isValidDate('2025-06-01')).toBe(true);
    expect(isValidDate('2025-06-01T10:00:00Z')).toBe(true);
  });
  it('rejects invalid dates', () => {
    expect(isValidDate('not-a-date')).toBe(false);
    expect(isValidDate('')).toBe(false);
    expect(isValidDate(42)).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('accepts well-formed emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('alice.bob@sub.domain.co.uk')).toBe(true);
  });
  it('rejects malformed emails', () => {
    expect(isValidEmail('no-at-sign')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('isValidUUID', () => {
  it('accepts valid UUIDs', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUUID('6BA7B810-9DAD-11D1-80B4-00C04FD430C8')).toBe(true);
  });
  it('rejects invalid UUIDs', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
    expect(isValidUUID('')).toBe(false);
  });
});

describe('isObject', () => {
  it('accepts plain objects', () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1 })).toBe(true);
  });
  it('rejects arrays, null, and primitives', () => {
    expect(isObject([])).toBe(false);
    expect(isObject(null)).toBe(false);
    expect(isObject('string')).toBe(false);
    expect(isObject(42)).toBe(false);
  });
});

describe('isBoolean', () => {
  it('accepts true and false', () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(false)).toBe(true);
  });
  it('rejects non-booleans', () => {
    expect(isBoolean(0)).toBe(false);
    expect(isBoolean('true')).toBe(false);
    expect(isBoolean(null)).toBe(false);
  });
});
