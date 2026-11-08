/** Browser-safe rules for the delivery outbox (emails, agreements and letters). */
export const MAX_DELIVERY_ATTEMPTS = 5;
export type OutboxStatus = 'pending' | 'sending' | 'sent' | 'failed';

/** Minutes to wait before the next try: 2, 4, 8, 16 … capped at one hour. */
export function retryDelayMinutes(attempts: number) {
  return Math.min(60, 2 ** Math.max(1, attempts));
}

export function canAutoRetry(attempts: number) {
  return attempts < MAX_DELIVERY_ATTEMPTS;
}

/** What staff see next to a delivery. Rows still being worked on count as pending. */
export function deliveryLabel(status: OutboxStatus | string): 'Sent' | 'Pending' | 'Failed' {
  if (status === 'sent') return 'Sent';
  if (status === 'failed') return 'Failed';
  return 'Pending';
}

export function deliveryKindLabel(kind: string, trigger: string) {
  if (kind === 'agreement_pdf') return 'Agreement PDF';
  if (kind === 'offer_letter') return 'Offer letter';
  if (kind === 'promotion_letter') return 'Promotion letter';
  return `Email · ${trigger.replace(/_/g, ' ')}`;
}

/** Overall result reported to the person who triggered the change. */
export function summariseDeliveries(statuses: string[]): 'sent' | 'queued' | 'failed' | 'none' {
  if (!statuses.length) return 'none';
  if (statuses.every((s) => s === 'sent')) return 'sent';
  if (statuses.some((s) => s === 'failed')) return 'failed';
  return 'queued';
}

/** Page-by-page loading: 50 rows per page. */
export const PAGE_SIZE = 50;
export function pageRange(page: number, size = PAGE_SIZE) {
  const p = Math.max(0, Math.floor(page));
  return { from: p * size, to: p * size + size - 1 };
}
export function pageCount(total: number, size = PAGE_SIZE) {
  return Math.max(1, Math.ceil(Math.max(0, total) / size));
}
