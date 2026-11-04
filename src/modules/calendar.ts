import { events, couple, venue } from '../data/wedding';
import type { EventDef } from '../data/wedding';

function toUtcStamp(iso: string, addMinutes = 0): string {
  const date = new Date(iso);
  date.setMinutes(date.getMinutes() + addMinutes);
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escape(text: string): string {
  return text.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
}

function vevent(event: EventDef): string[] {
  const title = `${event.title} · ${couple.groom.name} & ${couple.bride.name}`;
  return [
    'BEGIN:VEVENT',
    `UID:${event.id}-lanthanh2026@wedding`,
    `DTSTAMP:${toUtcStamp(new Date().toISOString())}`,
    `DTSTART:${toUtcStamp(event.startsAt)}`,
    `DTEND:${toUtcStamp(event.startsAt, event.durationMinutes)}`,
    `SUMMARY:${escape(title)}`,
    `LOCATION:${escape(`${event.place}, ${event.address}`)}`,
    `DESCRIPTION:${escape('Thiệp cưới: Hoàng Lân & Trần Kim Thanh - 29.11.2026')}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Ngày mai là đám cưới Hoàng Lân & Kim Thanh',
    'END:VALARM',
    'END:VEVENT',
  ];
}

function buildIcs(): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//lan-thanh-wedding//VI//',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events.flatMap(vevent),
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

function googleUrl(event: EventDef): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${event.title} · ${couple.groom.name} & ${couple.bride.name}`,
    dates: `${toUtcStamp(event.startsAt)}/${toUtcStamp(event.startsAt, event.durationMinutes)}`,
    details: 'Thiệp cưới online: Hoàng Lân & Trần Kim Thanh',
    location: `${event.place}, ${event.address}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function mapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Nút "Thêm vào lịch" (tải .ics) và nút Google Calendar. */
export function initCalendar(): void {
  const icsBtn = document.querySelector<HTMLButtonElement>('#add-calendar');
  const gcalLink = document.querySelector<HTMLAnchorElement>('#google-calendar');
  const party = events[1] ?? events[0];

  icsBtn?.addEventListener('click', () => {
    const blob = new Blob([buildIcs()], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dam-cuoi-lan-thanh-29-11-2026.ics';
    link.click();
    URL.revokeObjectURL(url);
  });

  if (gcalLink && party) gcalLink.href = googleUrl(party);

  document.querySelectorAll<HTMLAnchorElement>('[data-map]').forEach((link) => {
    link.href = mapsUrl(link.dataset.map ?? venue.address);
  });

  const directions = document.querySelector<HTMLAnchorElement>('#venue-directions');
  if (directions) directions.href = venue.mapsUrl;
}
