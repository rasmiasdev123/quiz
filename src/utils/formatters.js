// Date, number, and text formatters
// This file will be populated in Step 13

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {string} format - Format style (default: 'short')
 * @param {string} timezone - Timezone (default: 'Asia/Kolkata' for IST)
 * @returns {string} - Formatted date string
 */
export function formatDate(date, format = 'short', timezone = 'Asia/Kolkata') {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options = {
    timeZone: timezone,
    year: 'numeric',
    month: format === 'long' ? 'long' : 'short',
    day: 'numeric',
  };
  
  if (format === 'long' || format === 'datetime') {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
    options.hour12 = true;
  }
  
  return dateObj.toLocaleDateString('en-IN', options);
}

/**
 * Format date and time in Indian timezone
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date and time string in IST
 */
export function formatDateTimeIST(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} - Formatted number string
 */
export function formatNumber(num) {
  return num.toLocaleString('en-US');
}

/**
 * Format duration in seconds or minutes to readable string
 * @param {number} duration - Duration in seconds or minutes
 * @param {string} unit - Unit of duration ('seconds' or 'minutes', default: 'seconds')
 * @returns {string} - Formatted duration (e.g., "1h 30m", "45m")
 */
export function formatDuration(duration, unit = 'seconds') {
  let minutes = unit === 'seconds' ? Math.floor(duration / 60) : duration;
  
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Format percentage from score and total
 * @param {number} score - Current score
 * @param {number} total - Total possible score
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} - Formatted percentage string
 */
export function formatPercentage(score, total, decimals = 1) {
  if (!total || total === 0) return '0%';
  const percentage = (score / total) * 100;
  return percentage.toFixed(decimals) + '%';
}

/**
 * Format score display (e.g., "15/20")
 * @param {number} score - Current score
 * @param {number} total - Total possible score
 * @returns {string} - Formatted score string
 */
export function formatScore(score, total) {
  return `${score}/${total}`;
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 5 minutes")
 * @param {Date|string} date - Date to format
 * @returns {string} - Relative time string
 */
export function formatRelativeTime(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  if (Math.abs(diffInSeconds) < 60) {
    return diffInSeconds < 0 ? 'in a few seconds' : 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) {
    return diffInMinutes < 0 
      ? `in ${Math.abs(diffInMinutes)} minute${Math.abs(diffInMinutes) !== 1 ? 's' : ''}`
      : `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    return diffInHours < 0
      ? `in ${Math.abs(diffInHours)} hour${Math.abs(diffInHours) !== 1 ? 's' : ''}`
      : `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (Math.abs(diffInDays) < 30) {
    return diffInDays < 0
      ? `in ${Math.abs(diffInDays)} day${Math.abs(diffInDays) !== 1 ? 's' : ''}`
      : `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }
  
  return formatDate(date, 'short');
}

