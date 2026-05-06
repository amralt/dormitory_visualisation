// api.js
const BASE_URL = 'http://localhost:8000'; // замените на реальный адрес бэкенда

// Получить User-ID из localStorage (устанавливается после логина)
const getUserId = () => {
  const id = localStorage.getItem('userId');
  return id ? parseInt(id, 10) : null;
};

// Универсальный запрос с заголовком X-User-ID
async function request(endpoint, options = {}) {
  const userId = getUserId();
  if (!userId && !endpoint.includes('/login')) {
    throw new Error('User not authenticated');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(userId && { 'X-User-ID': userId.toString() }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch (e) {}
    throw new Error(errorMessage);
  }

  // Для эндпоинта /api/login может не быть тела
  if (response.status === 204) return null;
  return response.json();
}

// Авторизация
export async function login(username, password) {
  const params = new URLSearchParams({ username, password });
  const data = await request(`/api/login?${params.toString()}`, { method: 'POST' });
  // Предполагаем, что сервер возвращает объект с user_id
  if (data && data.user_id) {
    localStorage.setItem('userId', data.user_id);
    localStorage.setItem('userName', data.username);
  }
  return data;
}

// Статистика по общежитию
export async function fetchDormitoryStats(dormitoryName) {
  return request(`/api/dormitory/${encodeURIComponent(dormitoryName)}/stats`);
}

// Поиск студентов
export async function searchStudents(query, dormitory = null) {
  const params = new URLSearchParams({ qwery: query });
  if (dormitory) params.append('dormitory', dormitory);
  return request(`/api/residents/search_students/?${params.toString()}`);
}

// Фильтр жильцов – все параметры необязательны
export async function filterResidents(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  const query = params.toString();
  return request(`/api/residents/filter${query ? `?${query}` : ''}`);
}

// Получить студентов на этаже (используется в DormitoryStats)
export async function fetchFloorStudents(floorNumber, dormitory) {
  return request(`/api/floor/${floorNumber}/students?dormitory=${encodeURIComponent(dormitory)}`);
}

// Получить список всех общежитий с флагом visible
export async function fetchDormitories() {
  const data = await request('/api/dormitory/');
  // Ожидаем массив объектов { name: string, visible: boolean }
  return Array.isArray(data) ? data : [];
}
