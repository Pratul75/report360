import clsx from 'clsx';

/**
 * Combine class names with conditional support
 * @param  {...any} inputs - Class names to combine
 * @returns {string} Combined class name string
 */
export const cn = (...inputs) => {
  return clsx(inputs);
};

/**
 * Format a date string to a readable format (DD/MM/YYYY)
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return '-';
  }
};

/**
 * Format a number as currency (INR)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0.00';
  
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `₹${parseFloat(amount).toFixed(2)}`;
  }
};

/**
 * Format a number with commas for thousands
 * @param {number} number - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined) return '0';
  
  try {
    return new Intl.NumberFormat('en-IN').format(number);
  } catch (error) {
    return number.toString();
  }
};

/**
 * Capitalize first letter of a string
 * @param {string} str - The string to capitalize
 * @returns {string} Capitalized string
 */
export const capitalizeFirstLetter = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Convert snake_case to Title Case
 * @param {string} str - The string to convert
 * @returns {string} Title case string
 */
export const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .split('_')
    .map(word => capitalizeFirstLetter(word))
    .join(' ');
};

/**
 * Get initials from a name
 * @param {string} name - The full name
 * @returns {string} Initials
 */
export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Check if a date is in the past
 * @param {string|Date} dateString - The date to check
 * @returns {boolean} True if date is in the past
 */
export const isPastDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date < new Date();
  } catch (error) {
    return false;
  }
};

/**
 * Check if a date is today
 * @param {string|Date} dateString - The date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (dateString) => {
  try {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    return false;
  }
};

/**
 * Get time ago string (e.g., "2 hours ago")
 * @param {string|Date} dateString - The date to compare
 * @returns {string} Time ago string
 */
export const getTimeAgo = (dateString) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const secondsAgo = Math.floor((now - date) / 1000);

    if (secondsAgo < 60) return 'just now';
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`;
    
    return formatDate(dateString);
  } catch (error) {
    return '-';
  }
};

/**
 * Truncate text to specified length
 * @param {string} text - The text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 50) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

/**
 * Check if object is empty
 * @param {object} obj - The object to check
 * @returns {boolean} True if object is empty
 */
export const isEmpty = (obj) => {
  if (!obj) return true;
  if (typeof obj !== 'object') return false;
  return Object.keys(obj).length === 0;
};
