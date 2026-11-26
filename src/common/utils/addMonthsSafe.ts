export const addMonthsSafe = (date: Date, months: number): Date => {
  const d = new Date(date);
  const targetMonth = d.getMonth() + months;
  const targetYear = d.getFullYear() + Math.floor(targetMonth / 12);
  const actualMonth = targetMonth % 12;

  const day = d.getDate();

  const daysInTargetMonth = new Date(targetYear, actualMonth + 1, 0).getDate();

  const targetDay = Math.min(day, daysInTargetMonth);

  return new Date(targetYear, actualMonth, targetDay);
};
