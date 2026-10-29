import { describe, expect, it } from 'vitest';
import { balanceDue, canRecordPayment, canVoid, invoiceTotal, validatePayment } from './billing';
import { describeActivity } from './activity';

describe('billing rules', () => {
  it('totals line items to two decimals', () => {
    expect(invoiceTotal([{ quantity: 2, unit_price: 1500.555 }, { quantity: 1, unit_price: 100 }])).toBe(3101.11);
  });
  it('never shows a negative balance', () => {
    expect(balanceDue(1000, 1200)).toBe(0);
  });
  it('rejects payments above the balance due', () => {
    expect(validatePayment(600, 1000, 500)).toMatch(/more than/);
    expect(validatePayment(500, 1000, 500)).toBeNull();
    expect(validatePayment(0, 1000, 0)).toMatch(/greater than zero/);
  });
  it('only takes payments on sent, partly paid or overdue invoices', () => {
    expect(canRecordPayment('draft')).toBe(false);
    expect(canRecordPayment('void')).toBe(false);
    expect(canRecordPayment('overdue')).toBe(true);
  });
  it('cannot void an invoice that has payments', () => {
    expect(canVoid('sent', 100)).toBe(false);
    expect(canVoid('sent', 0)).toBe(true);
  });
});

describe('activity labels', () => {
  it('describes a stage change', () => {
    expect(describeActivity({ entity_type: 'leads', verb: 'stage_changed', from_value: 'new', to_value: 'won', meta: null })).toBe('Lead moved from new to won');
  });
});
