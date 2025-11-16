export async function getAllEvents() {
  return import('../models/eventsData.js').then(m => m.events);
}

export async function getEventById(id) {
  const list = await import('../models/eventsData.js').then(m => m.events);
  return list.find(e => String(e.id) === String(id));
}

export async function registerForEvent(formData) {
  // TODO: integrate with backend API later
  // This is a mock implementation to simulate success
  // Attach timestamp for audit trail (frontend only)
  const payload = { ...formData, registeredAt: new Date().toISOString() };
  // console.log('Mock registration:', payload);
  return { success: true, message: 'Registered successfully!', data: payload };
}


