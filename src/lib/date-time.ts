const dateTimeFormatter = new Intl.DateTimeFormat('th-TH', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatDateTime(value: string | null) {
  if (!value) return 'ไม่ทราบวันเวลา';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'ไม่ทราบวันเวลา' : dateTimeFormatter.format(date);
}
