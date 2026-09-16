import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { fetchDormitoryStats, fetchDormitories, filterResidents } from './api';
import facultyColors from '../config/facultyColors';
import './Dashboard.css'
import { getFormColor } from '../config/formofstudy_colors';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartDataLabels);

const categoryColors = {
  'Бюджет': '#4caf50',
  'Контракт': '#ff9800',
  'Аспирант': '#9c27b0',
  'Целевое': '#00bcd4',
  'Не указано': '#9e9e9e',
};
const getCategoryColor = (cat) => categoryColors[cat] || '#607d8b';

const customBgPlugin = {
  id: 'customBg',
  beforeDraw: (chart) => {
    const ctx = chart.canvas.getContext('2d');
    ctx.save(); ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, chart.width, chart.height); ctx.restore();
  }
};

const pieColors = ['#e53935', '#ffb300', '#43a047', '#8e24aa'];
const barColors = [ '#8e24aa', '#43a047', '#fb8c00', '#e53935', '#00acc1', '#3949ab', '#f4511e', '#7cb342', '#d81b60'];

const Dashboard = ({ dormId, onBack, onLogout, onDownloadClick, userName }) => {
  const dropdownRef = useRef(null);
  const pieRef = useRef(null);
  const barRef = useRef(null);

  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedDorms, setSelectedDorms] = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [availableDorms, setAvailableDorms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllFaculties, setShowAllFaculties] = useState(false);
  const [allStudents, setAllStudents] = useState([]);         // список всех студентов
const [isStackedMode, setStackedMode] = useState(false);    // режим stacked bar

  useEffect(() => {
    const loadDormsAndStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const allDorms = await fetchDormitories();
        const visibleDorms = allDorms.map(d => d.name);
        setAvailableDorms(visibleDorms);

        if (visibleDorms.length === 0) {
          setError('Нет доступных общежитий для отображения');
          setLoading(false);
          return;
        }

        const results = await Promise.all(
          visibleDorms.map(async (name) => {
            try {
              const stats = await fetchDormitoryStats(name);
              return { name, stats };
            } catch (err) {
              console.error(`Ошибка загрузки статистики для ${name}:`, err);
              return { name, stats: null };
            }
          })
        );
        const map = {};
        results.forEach(({ name, stats }) => {
          if (stats) map[name] = stats;
        });
        setStatsMap(map);
      } catch (err) {
        console.error(err);
        setError('Не удалось загрузить данные об общежитиях');
      } finally {
        setLoading(false);
      }
    };
    loadDormsAndStats();
  }, []);

  useEffect(() => {
    if (availableDorms.length === 0) return;
    if (dormId && availableDorms.includes(dormId)) {
      setSelectedDorms([dormId]);
    } else {
      setSelectedDorms(availableDorms);
    }
  }, [dormId, availableDorms]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
  const loadAllStudents = async () => {
    try {
      const students = await filterResidents({});  // без фильтров – все
      setAllStudents(students);
    } catch (err) {
      console.error('Ошибка загрузки списка студентов:', err);
    }
  };
  loadAllStudents();
}, []);

  const getAggregatedData = () => {
    let agg = { totalRooms: 0, occupied: 0, partially: 0, free: 0, totalStudents: 0, departments: {} };
    selectedDorms.forEach(id => {
      const stat = statsMap[id];
      if (!stat) return;
      agg.totalRooms += stat.total_rooms;
      agg.occupied += stat.occupied_rooms;
      agg.partially += stat.partially_occupied;
      agg.free += stat.free_rooms;
      agg.totalStudents += stat.total_students;
      Object.entries(stat.departments_stats || {}).forEach(([dept, count]) => {
        agg.departments[dept] = (agg.departments[dept] || 0) + count;
      });
    });
    const sortedFacs = Object.keys(agg.departments)
      .map(k => ({ label: k, val: agg.departments[k] }))
      .sort((a, b) => b.val - a.val);
    return { agg, sortedFacs };
  };

  const getStackedBarData = () => {
  // Фильтруем студентов по выбранным общежитиям
  const filteredStudents = allStudents.filter(s => selectedDorms.includes(s.dormitory));

  // Группируем: { факультет: { категория: количество } }
  const facultyFormMap = {};
  filteredStudents.forEach(student => {
    const dept = student.department || 'Без факультета';
    const form = student.resident_category || 'Не указано';
    if (!facultyFormMap[dept]) facultyFormMap[dept] = {};
    facultyFormMap[dept][form] = (facultyFormMap[dept][form] || 0) + 1;
  });

  // Все факультеты (отсортированные по убыванию общего числа студентов)
  const faculties = Object.keys(facultyFormMap);
  faculties.sort((a, b) => {
    const sumA = Object.values(facultyFormMap[a]).reduce((s, v) => s + v, 0);
    const sumB = Object.values(facultyFormMap[b]).reduce((s, v) => s + v, 0);
    return sumB - sumA;
  });

  // Все возможные категории (формы обучения)
  const categories = [...new Set(filteredStudents.map(s => s.resident_category || 'Не указано'))];

  // Формируем datasets
  const datasets = categories.map(category => {
    const data = faculties.map(f => facultyFormMap[f]?.[category] || 0);
    return {
      label: category,
      data,
      backgroundColor: getFormColor(category),   // функция цвета (см. ниже)
      stack: 'stack1',
      borderRadius: 4,
    };
  });

  return { faculties, datasets };
};

  const { agg, sortedFacs } = getAggregatedData();

  let titleText = selectedDorms.length === availableDorms.length ? "Общая статистика: Студгородок" :
                  selectedDorms.length === 1 ? `Статистика: ${selectedDorms[0].replace('Общежитие ', 'Общещитие №')}` :
                  selectedDorms.length === 0 ? "Нет выбранных общежитий" : `Статистика (${selectedDorms.length} общ.)`;

  let btnText = selectedDorms.length === 1 ? selectedDorms[0].replace('Общежитие ', 'Общ. №') :
                selectedDorms.length === 0 ? "Выберите общежития" :
                selectedDorms.length === availableDorms.length ? "Весь Студгородок" : `Выбрано: ${selectedDorms.length} общ.`;

  const pieData = {
    labels: ['Полностью занятые', 'Частично занятые', 'Свободные', 'Ремонт/Резерв (нет данных)'],
    datasets: [{ data: [agg.occupied, agg.partially, agg.free, 0], backgroundColor: pieColors, borderWidth: 2, borderColor: '#ffffff' }]
  };

  const pieOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { font: { size: 14 } } },
    datalabels: {
      color: '#ffffff', 
      font: { weight: 'bold', size: 15.5 },
      formatter: (value) => value > 0 ? value : ''   // теперь всегда показываем число, если > 0
    }
  }
};

  // Обычные данные (не stacked)
const barDataSimple = {
  labels: sortedFacs.map(f => f.label),
  datasets: [{
    data: sortedFacs.map(f => f.val),
    backgroundColor: sortedFacs.map(f => facultyColors[f.label] || facultyColors.default),
    borderRadius: 6,
    borderWidth: 0,
  }]
};

// Stacked данные
const { faculties: stackedLabels, datasets: stackedDatasets } = isStackedMode && allStudents.length
  ? getStackedBarData()
  : { faculties: [], datasets: [] };

const barData = isStackedMode && stackedDatasets.length
  ? { labels: stackedLabels, datasets: stackedDatasets }
  : barDataSimple;

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: isStackedMode
      ? { position: 'top', labels: { font: { size: 12, weight: 'bold' } } }
      : { display: false },
    datalabels: isStackedMode
      ? {
          color: '#fff',
          font: { weight: 'bold', size: 12 },
          formatter: (value) => value > 0 ? value : '',
          anchor: 'center',
          align: 'center',
        }
      : { color: '#37474f', anchor: 'end', align: 'top', font: { weight: 'bold', size: 14.5 } },
  },
  scales: {
    y: { beginAtZero: true, grid: { color: '#eceff1' }, ticks: { font: { size: 13.5 } } },
    x: { grid: { display: false }, ticks: { font: { size: 13.5 }, rotation: isStackedMode ? 20 : 0 } },
  },
  // Для stacked bar нужно указать stacked true (делается через stack в dataset, но можно добавить глобально)
  ...(isStackedMode && { scales: { y: { stacked: true }, x: { stacked: true } } }),
};

  const downloadChart = (ref, filename) => {
    if (ref.current) {
      const link = document.createElement('a');
      link.download = filename;
      link.href = ref.current.toBase64Image();
      link.click();
    }
  };

  if (loading) return <div className="loading-spinner">Загрузка статистики...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <>
      <div className="app-container">
        <main className="main-content">
          <div className="dashboard-controls">
            <div className="left-actions">
              <button className="back-btn" onClick={onBack}>← Вернуться назад</button>
              <button className="download-table-btn" onClick={onDownloadClick}>
                Скачать таблицу
              </button>
            </div>

            <h1 className="dashboard-title">{titleText}</h1>

            <div className="right-filter" ref={dropdownRef}>
              <button className="dropdown-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                {btnText}
              </button>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-actions-top">
                    <button className="text-btn" onClick={() => setSelectedDorms(availableDorms)}>Выбрать все</button>
                    <button className="text-btn" onClick={() => setSelectedDorms([])}>Сбросить</button>
                  </div>
                  <div className="checkbox-grid">
                    {availableDorms.map(name => (
                      <label key={name} className="checkbox-item">
                        <input 
                          type="checkbox" 
                          checked={selectedDorms.includes(name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDorms(prev => [...prev, name]);
                            } else {
                              setSelectedDorms(prev => prev.filter(d => d !== name));
                            }
                          }}
                        /> {name.replace('Общежитие ', 'Общ. №')}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-card">
              <h3>Соотношение состояния комнат</h3>
              <div className="canvas-container">
                <Pie data={pieData} options={pieOptions} plugins={[customBgPlugin]} ref={pieRef} />
              </div>
              <button className="download-btn" onClick={() => downloadChart(pieRef, 'rooms_chart.png')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              </button>
            </div>
            <div className="chart-card">
  <div className="chart-header">
    <h3>Распределение студентов по факультетам</h3>
    <div className="chart-actions">
      <button
        className={`mode-toggle-btn ${isStackedMode ? 'active' : ''}`}
        onClick={() => setStackedMode(!isStackedMode)}
        title={isStackedMode ? "Показать обычную гистограмму" : "Показать распределение по формам обучения"}
      >
        {isStackedMode ? '📊 Обычный режим' : '📚 По формам обучения'}
      </button>
      <button className="download-btn" onClick={() => downloadChart(barRef, 'faculty_chart.png')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </button>
    </div>
  </div>
  <div className="canvas-container">
    <Bar data={barData} options={barOptions} plugins={[customBgPlugin]} ref={barRef} />
  </div>
</div>
          </div>

          <div className="stats-row">
            {/* Блок "Состояние комнат" – теперь содержит комнаты + фонд + заполненность */}
            <div className="stat-block">
              <h4>Состояние комнат</h4>
              <div className="dynamic-stat-list">
                <div className="stat-line"><span>Полностью занятые:</span> <span className="stat-val" style={{ color: '#e53935' }}>{agg.occupied}</span></div>
                <div className="stat-line"><span>Частично занятые:</span> <span className="stat-val" style={{ color: '#ffb300' }}>{agg.partially}</span></div>
                <div className="stat-line"><span>Свободные:</span> <span className="stat-val" style={{ color: '#43a047' }}>{agg.free}</span></div>
                <div className="stat-line"><span>Всего комнат (фонд):</span> <span className="stat-val">{agg.totalRooms}</span></div>
                <div className="stat-line"><span>Общая заполненность (по комнатам):</span> <span className="stat-val">{agg.totalRooms > 0 ? Math.round(((agg.occupied + agg.partially) / agg.totalRooms) * 100) : 0}%</span></div>
              </div>
            </div>

            {/* Блок "Проживающие по факультетам" – без изменений */}
            <div className="stat-block">
              <h4>Проживающие по факультетам</h4>
              <div className="dynamic-stat-list">
                {sortedFacs.length > 0 ? (
                  <>
                    {sortedFacs
                      .slice(0, showAllFaculties ? sortedFacs.length : 5)
                      .map(f => (
                        <div key={f.label} className="stat-line">
                          <span>{f.label}:</span>
                          <span className="stat-val">{f.val} чел.</span>
                        </div>
                      ))
                    }
                    {sortedFacs.length > 5 && (
                      <button
                        className="text-btn"
                        style={{ marginTop: '8px', padding: 0, fontSize: '14px' }}
                        onClick={() => setShowAllFaculties(!showAllFaculties)}
                      >
                        {showAllFaculties ? 'Скрыть' : `Ещё ${sortedFacs.length - 5}`}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="stat-line"><span>Нет данных</span></div>
                )}
              </div>
            </div>

            {/* Блок "Дополнительная информация" – теперь только общее число студентов */}
            <div className="stat-block">
              <h4>Дополнительная информация</h4>
              <div className="dynamic-stat-list">
                <div className="stat-line"><span>Всего студентов:</span> <span className="stat-val">{agg.totalStudents}</span></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Dashboard;