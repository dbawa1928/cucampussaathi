import type { CampusEventItem } from '../api/eventsApi';

function formatIcsDate(dateString: string): string {
  const date = new Date(dateString);
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

export function generateAndDownloadIcs(event: CampusEventItem): void {
  const dtStart = formatIcsDate(event.startDateTime);
  const dtEnd = formatIcsDate(event.endDateTime);
  const dtStamp = formatIcsDate(new Date().toISOString());

  const location =
    event.mode === 'OFFLINE'
      ? `${event.venue || 'Campus Venue'}${event.campusBlock ? `, Block ${event.campusBlock}` : ''}, Chandigarh University`
      : event.publicMeetingUrl || event.onlinePlatform || 'Online Event';

  const cleanDescription = (event.shortDescription || event.description || '')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

  const cleanSummary = (event.title || 'Campus Event')
    .replace(/\n/g, ' ')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Chandigarh University//CUCampusSaathi Campus Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:cucampus-event-${event._id}@cucampussaathi.onrender.com`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEnd:${dtEnd}`,
    `SUMMARY:${cleanSummary}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${location}`,
    `STATUS:${event.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED'}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
