import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CurrencyProvider, useCurrency } from './currency';
import { CURRENCY_KEY, RATE_CACHE_KEY } from './currency-rules';

function Price() {
  const { currency, formatRange, setCurrency } = useCurrency();
  return <><output aria-label="Converted range">{currency} {formatRange(290,440)}</output><button onClick={() => setCurrency('BDT')}>Select BDT</button></>;
}
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });
describe('shared currency persistence', () => {
  it('reuses the 24-hour cache without a request and remembers the chosen currency after remount', async () => {
    localStorage.setItem(RATE_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), rates: { USD:1, BDT:123 } }));
    const fetch = vi.spyOn(globalThis, 'fetch');
    const view = render(<CurrencyProvider><Price/><Price/></CurrencyProvider>);
    fireEvent.click(screen.getAllByText('Select BDT')[0] as HTMLElement);
    await waitFor(() => expect(screen.getAllByLabelText('Converted range').map(el => el.textContent)).toEqual(['BDT ৳35,500 to ৳54,500', 'BDT ৳35,500 to ৳54,500']));
    expect(localStorage.getItem(CURRENCY_KEY)).toBe('BDT');
    view.unmount();
    render(<CurrencyProvider><Price/></CurrencyProvider>);
    await waitFor(() => expect(screen.getByLabelText('Converted range').textContent).toBe('BDT ৳35,500 to ৳54,500'));
    expect(fetch).not.toHaveBeenCalled();
  });
});