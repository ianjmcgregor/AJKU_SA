/**
 * Date utility functions for the AJKU_SA karate membership app
 */

/**
 * Calculate age from date of birth
 * @param {string|Date} dateOfBirth - Date of birth in ISO string or Date object
 * @returns {number|string} - Age in years or 'N/A' if invalid
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 'N/A';
  
  try {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    // Check if the date is valid
    if (isNaN(birthDate.getTime())) {
      return 'Invalid Date';
    }
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error('Error calculating age:', error);
    return 'N/A';
  }
};

/**
 * Validate date of birth
 * @param {string} dateOfBirth - Date of birth in YYYY-MM-DD format
 * @returns {object} - { isValid: boolean, error: string|null }
 */
export const validateDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth) {
    return { isValid: false, error: 'Date of birth is required' };
  }

  const birthDate = new Date(dateOfBirth);
  
  if (isNaN(birthDate.getTime())) {
    return { isValid: false, error: 'Please enter a valid date of birth' };
  }

  const today = new Date();
  
  if (birthDate > today) {
    return { isValid: false, error: 'Date of birth cannot be in the future' };
  }

  const age = today.getFullYear() - birthDate.getFullYear();
  if (age > 120) {
    return { isValid: false, error: 'Please check the date of birth' };
  }

  return { isValid: true, error: null };
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'iso')
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    switch (format) {
      case 'long':
        return dateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'iso':
        return dateObj.toISOString().split('T')[0];
      case 'short':
      default:
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Get today's date in YYYY-MM-DD format for max attribute
 * @returns {string} - Today's date in YYYY-MM-DD format
 */
export const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Check if a person is under 18 based on date of birth
 * @param {string|Date} dateOfBirth - Date of birth
 * @returns {boolean} - True if under 18, false otherwise
 */
export const isUnder18 = (dateOfBirth) => {
  const age = calculateAge(dateOfBirth);
  return typeof age === 'number' && age < 18;
};