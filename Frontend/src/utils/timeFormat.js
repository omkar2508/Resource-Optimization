/**
 * Utility function to convert 24-hour time format to 12-hour format with AM/PM
 * UI ONLY - Does not modify stored data or backend logic
 * 
 * Examples:
 * "08:00-09:00" → "8:00 AM - 9:00 AM"
 * "13:45-14:45" → "1:45 PM - 2:45 PM"
 * "12:00-13:00" → "12:00 PM - 1:00 PM"
 * "00:30-01:30" → "12:30 AM - 1:30 AM"
 */

export function formatTime12Hour(timeString) {
  if (!timeString || typeof timeString !== 'string') {
    return timeString;
  }

  // Handle time slot format like "08:00-09:00" or "13:45-14:45"
  if (timeString.includes('-')) {
    const [startTime, endTime] = timeString.split('-').map(s => s.trim());
    const formattedStart = formatSingleTime12Hour(startTime);
    const formattedEnd = formatSingleTime12Hour(endTime);
    return `${formattedStart} - ${formattedEnd}`;
  }

  // Handle single time like "08:00" or "13:45"
  return formatSingleTime12Hour(timeString);
}

function formatSingleTime12Hour(timeString) {
  if (!timeString || typeof timeString !== 'string') {
    return timeString;
  }

  // Extract hours and minutes
  const timeRegex = /^(\d{1,2}):(\d{2})$/;
  const match = timeString.match(timeRegex);
  
  if (!match) {
    return timeString; // Return as-is if format is unexpected
  }

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  
  let period = 'AM';
  
  if (hours === 0) {
    hours = 12;
    period = 'AM';
  } else if (hours === 12) {
    period = 'PM';
  } else if (hours > 12) {
    hours = hours - 12;
    period = 'PM';
  }

  return `${hours}:${minutes} ${period}`;
}

/**
 * Format time slot for display in timetable cells
 * Handles both "HH:MM-HH:MM" format and single times
 */
export function formatTimeSlot(timeSlot) {
  return formatTime12Hour(timeSlot);
}
