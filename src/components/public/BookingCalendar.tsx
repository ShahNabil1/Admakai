import { useRef, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function monthDays(month: string) {
  const [year, number] = month.split('-').map(Number);
  if (!year || !number) return [];
  const start = new Date(Date.UTC(year, number - 1, 1));
  const offset = (start.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return [...Array.from({ length: offset }, () => ''), ...Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)];
}
export function moveMonth(month: string, offset: number) {
  const [year, number] = month.split('-').map(Number);
  return new Date(Date.UTC(year || 2026, (number || 1) - 1 + offset, 1)).toISOString().slice(0, 7);
}
export function BookingCalendar({ days, month, selected, today, onMonth, onSelect }: { days: string[]; month: string; selected: string; today: string; onMonth: (month: string) => void; onSelect: (day: string) => void }) {
  const grid = useRef<HTMLDivElement>(null);
  const cells = monthDays(month);
  const previous = moveMonth(month, -1), next = moveMonth(month, 1);
  const available = new Set(days);
  const first = days.find(day => day.startsWith(month));
  const label = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`));
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    const current = cells.indexOf((event.target as HTMLElement).dataset['day'] ?? '');
    let index = current + offset;
    while (index >= 0 && index < cells.length) {
      const candidate = cells[index];
      if (candidate && available.has(candidate)) { grid.current?.querySelector<HTMLButtonElement>(`[data-day="${candidate}"]`)?.focus(); break; }
      index += offset;
    }
  };
  return <div className="book-calendar"><div className="book-month"><Button type="button" className="book-round" size="icon" aria-label="Previous month" disabled={!days.some(day => day.slice(0, 7) <= previous)} onClick={() => onMonth(previous)}><ChevronLeft /></Button><h3>{label}</h3><Button type="button" className="book-round" size="icon" aria-label="Next month" disabled={!days.some(day => day.slice(0, 7) >= next)} onClick={() => onMonth(next)}><ChevronRight /></Button></div><div className="book-weekdays" aria-hidden="true">{['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => <span key={day}>{day}</span>)}</div><div className="book-calendar-grid" role="group" aria-label="Available dates" ref={grid} onKeyDown={keyboard}>{cells.map((day, i) => day ? <Button type="button" variant="ghost" key={day} data-day={day} className={`book-date ${selected === day ? 'selected' : ''} ${today === day ? 'today' : ''}`} disabled={!available.has(day)} tabIndex={day === (selected.startsWith(month) ? selected : first) ? 0 : -1} aria-label={new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`))} aria-pressed={selected === day} aria-current={today === day ? 'date' : undefined} onClick={() => onSelect(day)}>{Number(day.slice(-2))}</Button> : <span key={`empty-${i}`} />)}</div></div>;
}