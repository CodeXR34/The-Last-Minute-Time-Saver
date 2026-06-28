export const createCalendarEvent = async (task, token) => {
  if (!token) throw new Error('No calendar token available');

  const deadlineDate = task.deadline?.toDate ? task.deadline.toDate() : new Date(task.deadline);
  const endOfDay = new Date(deadlineDate);
  endOfDay.setHours(23, 59, 59, 999);

  const event = {
    summary: task.title,
    description: task.description || 'Task created from Last-Minute Life Saver',
    start: {
      date: deadlineDate.toISOString().split('T')[0], // All-day event
    },
    end: {
      date: new Date(deadlineDate.getTime() + 86400000).toISOString().split('T')[0], // Next day for all-day end
    },
    colorId: '9', // Default blue-ish color
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('TOKEN_EXPIRED');
    if (response.status === 403) throw new Error('PERMISSION_DENIED');
    throw new Error('Failed to create calendar event');
  }

  const data = await response.json();
  return data.id; // Return the event ID so we can save it to Firestore
};

export const updateCalendarEventComplete = async (eventId, task, token) => {
  if (!token) throw new Error('No calendar token available');
  if (!eventId) return;

  // First fetch the event to get its current state
  const getResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  if (!getResponse.ok) {
    if (getResponse.status === 401) throw new Error('TOKEN_EXPIRED');
    console.warn('Could not fetch calendar event, it might have been deleted.');
    return;
  }

  const event = await getResponse.json();

  // Update summary and color
  event.summary = `[Done] ${task.title}`;
  event.colorId = '2'; // Green color in Google Calendar

  const updateResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!updateResponse.ok) {
    if (updateResponse.status === 401) throw new Error('TOKEN_EXPIRED');
    if (updateResponse.status === 403) throw new Error('PERMISSION_DENIED');
    throw new Error('Failed to update calendar event');
  }
};
