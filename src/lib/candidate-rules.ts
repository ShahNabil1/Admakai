export const PDF_POLL_MS = 2000;
export const PDF_POLL_LIMIT_MS = 40000;
export const IMPORTANT_EMAILS = ['interview_scheduled', 'rejected', 'selected', 'offer', 'hired'];
export function shouldSendHiringEmail(trigger: string, enabled: boolean, notifications: boolean) {
  return enabled && (trigger === 'admin_new_application' || notifications || IMPORTANT_EMAILS.includes(trigger));
}
export const interviewJoinEnabled = (scheduled: string, now = Date.now()) => now >= new Date(scheduled).getTime() - 10 * 60000;
export const taskDueAt = (shortlisted: string, days: number) => new Date(new Date(shortlisted).getTime() + days * 86400000).toISOString();
export function daysRemaining(date: string, now = Date.now()) { return Math.ceil((new Date(date).getTime() - now) / 86400000); }
export function dhakaDate(value: string, time = false) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', ...(time ? { timeStyle: 'short' as const } : {}) }).format(new Date(value));
}
export function timeAgo(value: string, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - new Date(value).getTime()) / 60000));
  return minutes < 1 ? 'just now' : minutes < 60 ? `${minutes} min ago` : minutes < 1440 ? `${Math.floor(minutes / 60)} hours ago` : `${Math.floor(minutes / 1440)} days ago`;
}
export type TimelineStage = { key: string; sort_order: number; is_negative: boolean; is_terminal: boolean; candidate_label: string; candidate_description?: string | null; expected_days?: number | null; color?: string };
export type TimelineEvent = { to_status: string; created_at: string; message_to_candidate: string | null; reason: string | null };
export function applicationTimeline(stages: TimelineStage[], events: TimelineEvent[], current: string) {
  const side = ['rejected', 'waitlist', 'withdrawn'];
  const currentOrder = stages.find(s => s.key === current)?.sort_order ?? -1;
  return [...stages].sort((a,b) => a.sort_order-b.sort_order).filter(s => !side.includes(s.key) || s.key === current || events.some(e => e.to_status === s.key)).map(stage => {
    const event = [...events].reverse().find(e => e.to_status === stage.key);
    return { stage, event, state: stage.key === current ? 'current' : event ? 'done' : stage.sort_order < currentOrder && !side.includes(stage.key) ? 'passed' : 'future' };
  });
}
export function interviewCalendar(i: { id: string; scheduled_at: string; duration_minutes: number; meet_link: string | null; office_address: string | null }, title: string) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s: string) => s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;').replace(/\r/g,'');
  const start = new Date(i.scheduled_at);
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Admakai//Hiring//EN','BEGIN:VEVENT',`UID:${i.id}@admakai.com`,`DTSTAMP:${stamp(new Date())}`,`DTSTART:${stamp(start)}`,`DTEND:${stamp(new Date(start.getTime()+i.duration_minutes*60000))}`,`SUMMARY:${esc(`Admakai interview — ${title}`)}`,`LOCATION:${esc(i.meet_link ?? i.office_address ?? '')}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
}