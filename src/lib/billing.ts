export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'void';
export type LineItem = { quantity: number; unit_price: number };

const round2 = (n: number) => Math.round(n * 100) / 100;

export const lineTotal = (i: LineItem) => round2(i.quantity * i.unit_price);
export const invoiceTotal = (items: LineItem[]) => round2(items.reduce((s, i) => s + lineTotal(i), 0));
export const balanceDue = (subtotal: number, paid: number) => Math.max(0, round2(subtotal - paid));

/** Payments can only be recorded against invoices that were sent and still owe money. */
export const canRecordPayment = (s: InvoiceStatus) => s === 'sent' || s === 'partially_paid' || s === 'overdue';
export const isEditable = (s: InvoiceStatus) => s === 'draft';
export const canVoid = (s: InvoiceStatus, paid: number) => s !== 'void' && s !== 'paid' && paid === 0;

export function validatePayment(amount: number, subtotal: number, paid: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return 'Enter an amount greater than zero.';
  if (round2(amount) > balanceDue(subtotal, paid)) return 'The amount is more than the balance due.';
  return null;
}

export function formatMoney(n: number, currency = 'BDT') {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export const PAYMENT_METHODS = ['bank', 'bkash', 'nagad', 'card', 'cash', 'other'] as const;
