import { calculateAge, validateDateOfBirth, formatDate, getTodayString, isUnder18 } from '../dateUtils';

describe('Date Utils', () => {
  describe('calculateAge', () => {
    it('should calculate correct age for a valid date', () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 25;
      const birthDate = `${birthYear}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      expect(calculateAge(birthDate)).toBe(25);
    });

    it('should return N/A for null/undefined input', () => {
      expect(calculateAge(null)).toBe('N/A');
      expect(calculateAge(undefined)).toBe('N/A');
      expect(calculateAge('')).toBe('N/A');
    });

    it('should return Invalid Date for invalid date string', () => {
      expect(calculateAge('invalid-date')).toBe('Invalid Date');
    });

    it('should handle age calculation correctly around birthday', () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 30;
      const birthDate = `${birthYear}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      expect(calculateAge(birthDate)).toBe(30);
    });
  });

  describe('validateDateOfBirth', () => {
    it('should validate a correct date of birth', () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 20;
      const birthDate = `${birthYear}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const result = validateDateOfBirth(birthDate);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should reject future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];
      
      const result = validateDateOfBirth(futureDate);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Date of birth cannot be in the future');
    });

    it('should reject dates over 120 years ago', () => {
      const oldDate = '1900-01-01';
      
      const result = validateDateOfBirth(oldDate);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please check the date of birth');
    });

    it('should reject invalid date formats', () => {
      const result = validateDateOfBirth('invalid-date');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid date of birth');
    });

    it('should require date of birth', () => {
      const result = validateDateOfBirth('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Date of birth is required');
    });
  });

  describe('formatDate', () => {
    it('should format date in short format', () => {
      const date = '2020-05-15';
      const formatted = formatDate(date, 'short');
      expect(formatted).toMatch(/May 15, 2020/);
    });

    it('should format date in long format', () => {
      const date = '2020-05-15';
      const formatted = formatDate(date, 'long');
      expect(formatted).toMatch(/Friday, May 15, 2020/);
    });

    it('should format date in ISO format', () => {
      const date = '2020-05-15';
      const formatted = formatDate(date, 'iso');
      expect(formatted).toBe('2020-05-15');
    });

    it('should return N/A for invalid dates', () => {
      expect(formatDate(null)).toBe('N/A');
      expect(formatDate('invalid')).toBe('Invalid Date');
    });
  });

  describe('getTodayString', () => {
    it('should return today\'s date in YYYY-MM-DD format', () => {
      const today = new Date();
      const expected = today.toISOString().split('T')[0];
      
      expect(getTodayString()).toBe(expected);
    });
  });

  describe('isUnder18', () => {
    it('should return true for person under 18', () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 15;
      const birthDate = `${birthYear}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      expect(isUnder18(birthDate)).toBe(true);
    });

    it('should return false for person 18 or older', () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 20;
      const birthDate = `${birthYear}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      expect(isUnder18(birthDate)).toBe(false);
    });

    it('should handle invalid dates', () => {
      expect(isUnder18('invalid-date')).toBe(false);
      expect(isUnder18(null)).toBe(false);
    });
  });
});