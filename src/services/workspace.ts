// Google Workspace Services Integration
// Supports Google Tasks, Gmail, Google Calendar, Google Chat, Google Meet, and Google Picker

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

// 1. Google Tasks Types & APIs
export interface GoogleTaskList {
  id: string;
  title: string;
  updated: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  updated?: string;
}

export async function fetchTaskLists(accessToken: string): Promise<GoogleTaskList[]> {
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch task lists (${res.status})`);
  }
  const data = await res.json();
  return data.items || [];
}

export async function fetchTasks(accessToken: string, taskListId: string = '@default'): Promise<GoogleTask[]> {
  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks?showCompleted=true&showHidden=true`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch tasks (${res.status})`);
  }
  const data = await res.json();
  return data.items || [];
}

export async function createGoogleTask(
  accessToken: string,
  taskListId: string = '@default',
  task: { title: string; notes?: string; due?: string }
): Promise<GoogleTask> {
  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create task (${res.status})`);
  }
  return await res.json();
}

export async function updateGoogleTaskStatus(
  accessToken: string,
  taskListId: string = '@default',
  taskId: string,
  status: 'needsAction' | 'completed'
): Promise<GoogleTask> {
  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to update task (${res.status})`);
  }
  return await res.json();
}

export async function deleteGoogleTask(
  accessToken: string,
  taskListId: string = '@default',
  taskId: string
): Promise<void> {
  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete task (${res.status})`);
  }
}

// 2. Gmail Types & APIs
export interface GmailMessageSummary {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
}

export async function fetchRecentEmails(
  accessToken: string,
  maxResults: number = 8
): Promise<GmailMessageSummary[]> {
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${encodeURIComponent('label:INBOX')}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!listRes.ok) {
    const err = await listRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to list emails (${listRes.status})`);
  }
  const listData = await listRes.json();
  if (!listData.messages || listData.messages.length === 0) {
    return [];
  }

  // Fetch summary metadata for each message in parallel
  const details = await Promise.all(
    listData.messages.slice(0, maxResults).map(async (msg: { id: string }) => {
      try {
        const itemRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (!itemRes.ok) return null;
        const itemData = await itemRes.json();
        const headers = itemData.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

        return {
          id: itemData.id,
          threadId: itemData.threadId,
          subject,
          from,
          snippet: itemData.snippet || '',
          date,
        };
      } catch {
        return null;
      }
    })
  );

  return details.filter(Boolean) as GmailMessageSummary[];
}

export async function sendGmailMessage(
  accessToken: string,
  { to, subject, body }: { to: string; subject: string; body: string }
): Promise<{ id: string }> {
  // Construct RFC 2822 email message
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const emailLines = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    body,
  ];
  const rawEmail = emailLines.join('\r\n');
  const base64Encoded = btoa(unescape(encodeURIComponent(rawEmail)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: base64Encoded }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send email (${res.status})`);
  }
  return await res.json();
}

// 3. Google Calendar Types & APIs
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

export async function fetchCalendarEvents(
  accessToken: string,
  maxResults: number = 10
): Promise<CalendarEvent[]> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      thirtyDaysAgo
    )}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch calendar events (${res.status})`);
  }
  const data = await res.json();
  return data.items || [];
}

export async function createCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    startDateTime: string;
    endDateTime: string;
  }
): Promise<CalendarEvent> {
  const body = {
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: { dateTime: new Date(event.startDateTime).toISOString() },
    end: { dateTime: new Date(event.endDateTime).toISOString() },
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create calendar event (${res.status})`);
  }
  return await res.json();
}

// 4. Google Chat Types & APIs
export interface ChatSpace {
  name: string; // e.g., spaces/AAAAxxxx
  displayName?: string;
  type: 'ROOM' | 'DM';
}

export async function fetchChatSpaces(accessToken: string): Promise<ChatSpace[]> {
  const res = await fetch('https://chat.googleapis.com/v1/spaces', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to list chat spaces (${res.status})`);
  }
  const data = await res.json();
  return data.spaces || [];
}

export async function sendChatMessage(
  accessToken: string,
  spaceName: string,
  text: string
): Promise<{ name: string; text: string }> {
  const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send chat message (${res.status})`);
  }
  return await res.json();
}

// 5. Google Meet Types & APIs
export interface MeetSpace {
  name: string; // e.g., spaces/xxxx-yyyy-zzzz
  meetingUri: string;
  meetingCode: string;
}

export async function createGoogleMeetSpace(accessToken: string): Promise<MeetSpace> {
  const res = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Google Meet space (${res.status})`);
  }
  return await res.json();
}

// 6. Google Picker Helper
export interface PickedFile {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  sizeBytes?: number;
  lastEditedUtc?: number;
}

export function openGooglePicker({
  accessToken,
  onPicked,
  onCancel,
}: {
  accessToken: string;
  onPicked: (file: PickedFile) => void;
  onCancel?: () => void;
}): void {
  const loadPicker = () => {
    if (!window.google || !window.google.picker) {
      alert('Google Picker API is initializing. Please try again in 2 seconds.');
      return;
    }

    const pickerOrigin =
      window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
        ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
        : window.location.origin;

    const pickerCallback = (data: any) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const file = data.docs && data.docs[0];
        if (file) {
          onPicked({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            url: file.url,
            sizeBytes: file.sizeBytes,
            lastEditedUtc: file.lastEditedUtc,
          });
        }
      } else if (data.action === window.google.picker.Action.CANCEL) {
        if (onCancel) onCancel();
      }
    };

    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.DOCS)
      .setOAuthToken(accessToken)
      .setCallback(pickerCallback)
      .setOrigin(pickerOrigin)
      .setTitle('Select Infrastructure Project Document / Clearance DPR')
      .build();

    picker.setVisible(true);
  };

  if (window.gapi && !window.google?.picker) {
    window.gapi.load('picker', { callback: loadPicker });
  } else if (window.google?.picker) {
    loadPicker();
  } else {
    // If gapi not yet on window, inject script
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('picker', { callback: loadPicker });
    };
    document.body.appendChild(script);
  }
}

// 7. Google Sheets & Google Drive Integration
export interface GoogleSheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface GoogleSheetMetadata {
  spreadsheetId: string;
  title: string;
  sheets: {
    sheetId: number;
    title: string;
    rowCount?: number;
    columnCount?: number;
  }[];
}

export async function listGoogleSpreadsheets(accessToken: string): Promise<GoogleSheetFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime%20desc&pageSize=25`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to list Google Sheets (${res.status})`);
  }
  const data = await res.json();
  return data.files || [];
}

export async function fetchSpreadsheetMetadata(
  accessToken: string,
  spreadsheetId: string
): Promise<GoogleSheetMetadata> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch spreadsheet (${res.status})`);
  }
  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Untitled Spreadsheet',
    sheets: (data.sheets || []).map((s: any) => ({
      sheetId: s.properties?.sheetId,
      title: s.properties?.title || 'Sheet1',
      rowCount: s.properties?.gridProperties?.rowCount,
      columnCount: s.properties?.gridProperties?.columnCount,
    })),
  };
}

export async function fetchSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string = 'Sheet1!A1:Z500'
): Promise<string[][]> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(range)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to read sheet data (${res.status})`);
  }
  const data = await res.json();
  return data.values || [];
}

export async function createGoogleSpreadsheet(
  accessToken: string,
  title: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // Step 1: Create empty spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || `PMIS Projects Export - ${new Date().toISOString().split('T')[0]}`,
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create spreadsheet (${createRes.status})`);
  }

  const created = await createRes.json();
  const spreadsheetId = created.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Step 2: Write headers and rows
  const allValues = [headers, ...rows];
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'Sheet1!A1',
        majorDimension: 'ROWS',
        values: allValues,
      }),
    }
  );

  if (!writeRes.ok) {
    console.warn('Initial data write failed, but spreadsheet was created.');
  }

  return { spreadsheetId, spreadsheetUrl };
}

export function extractSpreadsheetId(urlOrId: string): string {
  if (!urlOrId) return '';
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return urlOrId.trim();
}

