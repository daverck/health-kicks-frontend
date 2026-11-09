import { formatPercentScore } from './number.formatters';

describe('number.formatters', () => {
  describe('formatPercentScore', () => {
    it('formats a normal ratio with 1 decimal digit by default', () => {
      expect(formatPercentScore(0.854)).toBe('85.4%');
      expect(formatPercentScore(1.0)).toBe('100.0%');
      expect(formatPercentScore(0)).toBe('0.0%');
    });

    it('formats with custom decimal digits', () => {
      expect(formatPercentScore(0.8546, 2)).toBe('85.46%');
      expect(formatPercentScore(0.8546, 0)).toBe('85%');
    });

    it('returns default fallback for null, undefined, or NaN', () => {
      expect(formatPercentScore(null)).toBe('—');
      expect(formatPercentScore(undefined)).toBe('—');
      expect(formatPercentScore(NaN)).toBe('—');
    });

    it('returns custom fallback when specified', () => {
      expect(formatPercentScore(null, 1, 'N/A')).toBe('N/A');
    });
  });
});
