import type { CampusEventItem } from '../api/eventsApi';

function formatIcsDate(dateString: string): string {
  const date = new Date(dateString);
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

export interface GoogleCalendarParams {
  title: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
}

export interface AppointmentIcsParams {
  id: string;
  teacherName: string;
  studentName?: string;
  startTime: string;
  endTime: string;
  meetingMode?: string;
  locationDetails?: string;
  meetingLink?: string;
  agenda?: string;
}

/**
 * Generate a direct Web URL to open Google Calendar with pre-filled event details.
 */
export function getGoogleCalendarUrl(params: GoogleCalendarParams): string {
  const dtStart = formatIcsDate(params.startDateTime);
  const dtEnd = formatIcsDate(params.endDateTime);
  const title = encodeURIComponent(params.title);
  const details = encodeURIComponent(params.description || '');
  const location = encodeURIComponent(params.location || '');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dtStart}/${dtEnd}&details=${details}&location=${location}`;
}

/**
 * Generate and download an .ICS file for a Campus Event.
 */
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
    `DTEND:${dtEnd}`,
    `SUMMARY:${cleanSummary}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${location}`,
    `STATUS:${event.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED'}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  downloadBlobAsFile(
    icsContent,
    `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`
  );
}

/**
 * Generate and download an .ICS file for a Faculty Consultation Appointment.
 */
export function generateAppointmentIcs(appt: AppointmentIcsParams): void {
  const dtStart = formatIcsDate(appt.startTime);
  const dtEnd = formatIcsDate(appt.endTime);
  const dtStamp = formatIcsDate(new Date().toISOString());

  const location =
    appt.meetingMode === 'ONLINE'
      ? appt.meetingLink || 'Virtual Google Meet / Zoom Conference'
      : appt.locationDetails || 'Faculty Cabin, Chandigarh University';

  const cleanSummary = `Faculty Consultation: Prof. ${appt.teacherName}${
    appt.studentName ? ` with ${appt.studentName}` : ''
  }`
    .replace(/\n/g, ' ')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

  const cleanDescription = [
    `Chandigarh University Academic Consultation`,
    `Faculty: Prof. ${appt.teacherName}`,
    appt.studentName ? `Student: ${appt.studentName}` : '',
    appt.agenda ? `Agenda: ${appt.agenda}` : '',
    appt.meetingLink ? `Meeting Link: ${appt.meetingLink}` : '',
  ]
    .filter(Boolean)
    .join('\\n');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Chandigarh University//CUCampusSaathi Appointments//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:cucampus-appt-${appt.id}@cucampussaathi.onrender.com`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${cleanSummary}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${location}`,
    `STATUS:CONFIRMED`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  downloadBlobAsFile(icsContent, `consultation-${appt.teacherName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`);
}

function downloadBlobAsFile(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
