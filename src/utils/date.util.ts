export function getDate(
  date: Date,
  offset: {
    days?: number;
    hours?: number;
    minutes?: number;
  }
): Date {
  const { days, hours, minutes } = offset;
  let totalOffsetSeconds = 0;
  if (days) {
    totalOffsetSeconds += (days * 24 * 60 * 60);
  }
  if (hours) {
    totalOffsetSeconds += (hours * 60 * 60);
  }
  if (minutes) {
    totalOffsetSeconds += (minutes * 60);
  }

  return new Date(date.getTime() + totalOffsetSeconds * 1000);
}