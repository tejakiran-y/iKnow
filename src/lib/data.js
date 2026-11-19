const STORAGE_KEY = 'iknow-courses';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export function loadLocalCourses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const courses = JSON.parse(raw);
    return Array.isArray(courses) ? courses : null;
  } catch {
    return null;
  }
}

export function saveLocalCourses(courses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  } catch (error) {
    console.error('Could not save courses in this browser:', error);
  }
}

export async function loadRemoteCourses() {
  if (!API_BASE_URL) return null;

  const response = await fetch(`${API_BASE_URL}/api/courses`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new Error(`Course load failed (${response.status})`);

  const payload = await response.json();
  const courses = Array.isArray(payload) ? payload : payload?.courses;
  if (!Array.isArray(courses)) throw new Error('The backend response must contain a courses array.');
  return courses;
}

let saveQueue = Promise.resolve();

export function saveRemoteCourses(courses) {
  if (!API_BASE_URL) return Promise.resolve();

  const snapshot = JSON.stringify({ courses });
  saveQueue = saveQueue.catch(() => {}).then(async () => {
    const response = await fetch(`${API_BASE_URL}/api/courses`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: snapshot,
    });

    if (!response.ok) {
      let message = `Course save failed (${response.status})`;
      try {
        const payload = await response.json();
        if (payload?.error) message = payload.error;
      } catch {}
      throw new Error(message);
    }
  });

  return saveQueue;
}
