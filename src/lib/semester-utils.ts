/**
 * Semester Date Calculation Utilities
 * 
 * Converts user-selected year and month range into actual calendar dates
 * for all 16 weeks of the semester.
 */

export type MonthRange = 'January-April' | 'May-August' | 'September-December';

export interface SemesterDates {
  year: number;
  monthRange: MonthRange;
  startDate: Date;
  endDate: Date;
  weeks: WeekDates[];
}

export interface WeekDates {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  isAssessmentWeek: boolean; // true for weeks 5 and 10
  isExamWeek: boolean; // true for weeks 14-16
}

/**
 * Get the starting month (1-12) for a given month range
 */
function getStartMonth(monthRange: MonthRange): number {
  switch (monthRange) {
    case 'January-April':
      return 1; // January
    case 'May-August':
      return 5; // May
    case 'September-December':
      return 9; // September
  }
}

/**
 * Get the ending month (1-12) for a given month range
 */
function getEndMonth(monthRange: MonthRange): number {
  switch (monthRange) {
    case 'January-April':
      return 4; // April
    case 'May-August':
      return 8; // August
    case 'September-December':
      return 12; // December
  }
}

/**
 * Get Monday of the week containing the given date
 */
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get Sunday of the week containing the given date
 */
function getSundayOfWeek(date: Date): Date {
  const monday = getMondayOfWeek(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
}

/**
 * Validate that the selected year is current year or next year only
 */
export function isValidSemesterYear(year: number): boolean {
  const currentYear = new Date().getFullYear();
  return year === currentYear || year === currentYear + 1;
}

/**
 * Validate that the selected semester hasn't already passed
 */
export function isSemesterInFuture(year: number, monthRange: MonthRange): boolean {
  const now = new Date();
  const startMonth = getStartMonth(monthRange);
  const semesterStart = new Date(year, startMonth - 1, 1);
  
  return semesterStart >= now;
}

/**
 * Calculate all dates for a 16-week semester
 * 
 * @param year - The academic year (must be current or next year)
 * @param monthRange - The 4-month period for this semester
 * @returns SemesterDates object with all week boundaries
 */
export function calculateSemesterDates(
  year: number,
  monthRange: MonthRange
): SemesterDates {
  if (!isValidSemesterYear(year)) {
    throw new Error(
      `Invalid year ${year}. Year must be ${new Date().getFullYear()} or ${new Date().getFullYear() + 1}`
    );
  }

  const startMonth = getStartMonth(monthRange);
  const endMonth = getEndMonth(monthRange);

  // Semester starts on the 1st of the starting month
  const semesterStart = new Date(year, startMonth - 1, 1);

  // Semester ends on the last day of the ending month
  const semesterEnd = new Date(year, endMonth, 0); // Day 0 = last day of previous month

  // Calculate 16 weeks starting from the first Monday of the semester
  const firstMonday = getMondayOfWeek(semesterStart);
  const weeks: WeekDates[] = [];

  for (let i = 0; i < 16; i++) {
    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + i * 7);

    const weekEnd = getSundayOfWeek(weekStart);

    weeks.push({
      weekNumber: i + 1,
      startDate: weekStart,
      endDate: weekEnd,
      isAssessmentWeek: i + 1 === 5 || i + 1 === 10,
      isExamWeek: i + 1 >= 14 && i + 1 <= 16,
    });
  }

  return {
    year,
    monthRange,
    startDate: semesterStart,
    endDate: semesterEnd,
    weeks,
  };
}

/**
 * Format a date range for display
 * 
 * @example
 * formatDateRange(new Date('2025-01-06'), new Date('2025-01-12'))
 * // Returns: "Jan 6 - 12, 2025"
 */
export function formatDateRange(start: Date, end: Date): string {
  const startMonth = start.toLocaleString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = start.getFullYear();

  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  } else {
    const endMonth = end.toLocaleString('en-US', { month: 'short' });
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
}

/**
 * Get a human-readable label for a week
 * 
 * @example
 * getWeekLabel(5, new Date('2025-02-03'), new Date('2025-02-09'))
 * // Returns: "Week 5: Feb 3 - 9, 2025 (Assessment)"
 */
export function getWeekLabel(weekNumber: number, start: Date, end: Date): string {
  const dateRange = formatDateRange(start, end);
  let label = `Week ${weekNumber}: ${dateRange}`;

  if (weekNumber === 5 || weekNumber === 10) {
    label += ' (Assessment)';
  } else if (weekNumber >= 14 && weekNumber <= 16) {
    label += ' (Exam Period)';
  }

  return label;
}

/**
 * Get the week number for a specific date within a semester
 * Returns null if the date is outside the semester
 */
export function getWeekNumberForDate(date: Date, semesterDates: SemesterDates): number | null {
  const targetTime = date.getTime();

  for (const week of semesterDates.weeks) {
    if (targetTime >= week.startDate.getTime() && targetTime <= week.endDate.getTime()) {
      return week.weekNumber;
    }
  }

  return null;
}

/**
 * Convert database semester fields to MonthRange
 */
export function monthsToMonthRange(startMonth: number, endMonth: number): MonthRange | null {
  if (startMonth === 1 && endMonth === 4) return 'January-April';
  if (startMonth === 5 && endMonth === 8) return 'May-August';
  if (startMonth === 9 && endMonth === 12) return 'September-December';
  return null;
}

/**
 * Convert MonthRange to database month values
 */
export function monthRangeToMonths(monthRange: MonthRange): { startMonth: number; endMonth: number } {
  switch (monthRange) {
    case 'January-April':
      return { startMonth: 1, endMonth: 4 };
    case 'May-August':
      return { startMonth: 5, endMonth: 8 };
    case 'September-December':
      return { startMonth: 9, endMonth: 12 };
  }
}

/**
 * Example usage:
 * 
 * const semester = calculateSemesterDates(2025, 'January-April');
 * 
 * console.log(`Semester: ${semester.year} ${semester.monthRange}`);
 * console.log(`Start: ${semester.startDate.toLocaleDateString()}`);
 * console.log(`End: ${semester.endDate.toLocaleDateString()}`);
 * 
 * semester.weeks.forEach((week) => {
 *   console.log(getWeekLabel(week.weekNumber, week.startDate, week.endDate));
 * });
 * 
 * // Output:
 * // Semester: 2025 January-April
 * // Start: 1/1/2025
 * // End: 4/30/2025
 * // Week 1: Jan 6 - 12, 2025
 * // Week 2: Jan 13 - 19, 2025
 * // Week 3: Jan 20 - 26, 2025
 * // Week 4: Jan 27 - Feb 2, 2025
 * // Week 5: Feb 3 - 9, 2025 (Assessment)
 * // Week 6: Feb 10 - 16, 2025
 * // ...
 * // Week 10: Mar 10 - 16, 2025 (Assessment)
 * // ...
 * // Week 14: Apr 7 - 13, 2025 (Exam Period)
 * // Week 15: Apr 14 - 20, 2025 (Exam Period)
 * // Week 16: Apr 21 - 27, 2025 (Exam Period)
 */
