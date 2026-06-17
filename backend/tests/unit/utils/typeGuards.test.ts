import { ensureString, getParamAsString } from '../../../src/utils/typeGuards';

describe('Type Guards', () => {
  describe('ensureString', () => {
    it('should return string when given a string', () => {
      expect(ensureString('hello', 'test')).toBe('hello');
    });

    it('should throw when given an array', () => {
      expect(() => ensureString(['a', 'b'], 'test')).toThrow(
        'Parameter test must be a single value, not an array'
      );
    });

    it('should throw when given undefined', () => {
      expect(() => ensureString(undefined, 'test')).toThrow(
        'Parameter test is required'
      );
    });

    it('should throw when given empty string', () => {
      expect(() => ensureString('', 'test')).toThrow(
        'Parameter test is required'
      );
    });
  });

  describe('getParamAsString', () => {
    it('should return string when given a string', () => {
      expect(getParamAsString('hello')).toBe('hello');
    });

    it('should return first element when given an array', () => {
      expect(getParamAsString(['first', 'second'])).toBe('first');
    });

    it('should return empty string when given undefined', () => {
      expect(getParamAsString(undefined)).toBe('');
    });
  });
});
