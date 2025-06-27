// Utility functions for time parsing and open status

/**
 * Parse a time string (either 'HH:mm' or 'h:mm AM/PM') into minutes since midnight.
 * Returns NaN if invalid.
 */
function parseTimeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return NaN;
    timeStr = timeStr.trim();
    // 24-hour format: HH:mm
    let match = timeStr.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (match) {
        return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    }
    // 12-hour format: h:mm AM/PM
    match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
        let hour = parseInt(match[1], 10);
        const minute = parseInt(match[2], 10);
        const period = match[3].toUpperCase();
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        return hour * 60 + minute;
    }
    return NaN;
}

/**
 * Calculate if a vendor is open now, given operatingHours and current date/time.
 * Handles overnight hours and deduplicates days.
 */
function isVendorOpenNow(operatingHours, now = new Date()) {
    if (!operatingHours || !operatingHours.openTime || !operatingHours.closeTime || !Array.isArray(operatingHours.days)) {
        return false;
    }
    // Deduplicate days
    const days = [...new Set(operatingHours.days.map(Number))];
    const today = now.getDay();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = parseTimeToMinutes(operatingHours.openTime);
    const closeMinutes = parseTimeToMinutes(operatingHours.closeTime);
    if (isNaN(openMinutes) || isNaN(closeMinutes)) return false;
    // Overnight case (e.g., 5:00 PM - 2:00 AM)
    if (openMinutes < closeMinutes) {
        // Normal same-day hours
        return days.includes(today) && nowMinutes >= openMinutes && nowMinutes < closeMinutes;
    } else {
        // Overnight hours: openTime > closeTime
        // Open if: (today is in days and now >= open) OR (yesterday is in days and now < close)
        const yesterday = (today + 6) % 7;
        return (days.includes(today) && nowMinutes >= openMinutes) ||
               (days.includes(yesterday) && nowMinutes < closeMinutes);
    }
}

module.exports = { parseTimeToMinutes, isVendorOpenNow }; 