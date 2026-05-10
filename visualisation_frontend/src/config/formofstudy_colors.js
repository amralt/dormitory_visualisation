// formofstudy_colors.js
// Цвета для различных форм обучения / категорий проживающих

export const formOfStudyColors = {
  // Бюджет
  'Бюджет': '#4caf50',
  'Обучающийся бюджетник': '#4caf50',
  'Бюджетник': '#4caf50',
  'Госбюджет': '#4caf50',
  // Контракт
  'Контракт': '#ff9800',
  'Обучающийся контрактник': '#ff9800',
  'Контрактник': '#ff9800',
  'Платное обучение': '#ff9800',
  // Аспирант
  'Аспирант': '#9c27b0',
  'Аспирантура': '#9c27b0',
  // Сотрудники
  'Сотрудник': '#00bcd4',
  'Работник': '#00bcd4',
  'Персонал': '#00bcd4',
  // Целевое
  'Целевое': '#e91e63',
  'Целевик': '#e91e63',
  // Неизвестное / отсутствует
  'Не указано': '#9e9e9e',
  '': '#9e9e9e',
};

// Функция для получения цвета по названию категории с частичным совпадением (без учёта регистра)
export const getFormColor = (category) => {
  if (!category) return '#9e9e9e';
  const lower = category.toLowerCase();
  
  if (lower.includes('бюджет')) return formOfStudyColors['Бюджет'];
  if (lower.includes('контракт')) return formOfStudyColors['Контракт'];
  if (lower.includes('аспирант')) return formOfStudyColors['Аспирант'];
  if (lower.includes('сотрудник')) return formOfStudyColors['Сотрудник'];
  if (lower.includes('целевой') || lower.includes('целевое')) return formOfStudyColors['Целевое'];
  
  // Если точное совпадение есть в словаре – берём его
  if (formOfStudyColors[category]) return formOfStudyColors[category];
  
  // Иначе – нейтральный цвет
  return '#607d8b';
};