import { budgets } from './booking-form';

export const bookingServiceLabels: Record<string, string> = {
  tvc: 'AI TVC or OVC', product_photos: 'Product photography', ugc: 'UGC content pack',
  brand_face: 'Brand face or mascot', unsure: 'Not sure yet',
};
export function submissionText(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}
export function bookingBudgetLabel(value: unknown): string {
  const text = submissionText(value);
  return budgets.find(budget => budget.value === text)?.label ?? text;
}
export function additionalBookingFields(brief: Record<string, unknown>) {
  const known = new Set(['name', 'email', 'whatsapp', 'brand', 'brand_name', 'need', 'message', 'budget', 'budget_band']);
  return Object.entries(brief).filter(([key]) => !known.has(key)).map(([key, value]) => ({ key, value: submissionText(value) }));
}