import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { fetchDormitoryStats, fetchDormitories } from './api';
import './Dashboard.css'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartDataLabels);

const customBgPlugin = {
  id: 'customBg',
  beforeDraw: (chart) => {
    const ctx = chart.canvas.getContext('2d');
    ctx.save(); ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, chart.width, chart.height); ctx.restore();
  }
};

const pieColors = ['#e53935', '#43a047', '#ffb300', '#8e24aa'];
const barColors = ['#1e88e5', '#8e24aa', '#43a047', '#fb8c00', '#e53935', '#00acc1', '#3949ab', '#f4511e', '#7cb342', '#d81b60'];

const Dashboard = ({ dormId, onBack, onLogout, onDownloadClick, userName }) => {
  const dropdownRef = useRef(null);
  const pieRef = useRef(null);
  const barRef = useRef(null);

  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedDorms, setSelectedDorms] = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [availableDorms, setAvailableDorms] = useState([]); // имена видимых общежитий
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllFaculties, setShowAllFaculties] = useState(false);

  // 1. Загружаем список видимых общежитий
  // 2. Затем для них загружаем статистику
  useEffect(() => {
    const loadDormsAndStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // Получаем все общежития и фильтруем visible === true
        const allDorms = await fetchDormitories();
        const visibleDorms = allDorms.map(d => d.name);
        setAvailableDorms(visibleDorms);

        if (visibleDorms.length === 0) {
          setError('Нет доступных общежитий для отображения');
          setLoading(false);
          return;
        }

        // Загружаем статистику для каждого видимого общежития
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

  // Установка выбранных общежитий при изменении dormId или загрузке списка
  useEffect(() => {
    if (availableDorms.length === 0) return;
    if (dormId && availableDorms.includes(dormId)) {
      setSelectedDorms([dormId]);
    } else {
      // Если не передан конкретный dormId — выбираем все видимые общежития
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

  // Агрегация данных по выбранным общежитиям
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

  const { agg, sortedFacs } = getAggregatedData();

  // Текст заголовка и кнопки в зависимости от выбранных общежитий
  let titleText = selectedDorms.length === availableDorms.length ? "Общая статистика: Студгородок" :
                  selectedDorms.length === 1 ? `Статистика: ${selectedDorms[0].replace('Общежитие ', 'Общ. №')}` :
                  selectedDorms.length === 0 ? "Нет выбранных общежитий" : `Суммарная статистика (${selectedDorms.length} общ.)`;

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
        color: '#ffffff', font: { weight: 'bold', size: 15.5 },
        formatter: (value, context) => {
          const dataset = context.chart.data.datasets[0].data;
          const total = dataset.reduce((a, b) => a + b, 0);
          return total > 0 && ((value / total) * 100) > 15 ? value : '';
        }
      }
    }
  };

  const barData = {
    labels: sortedFacs.map(f => f.label),
    datasets: [{ 
      data: sortedFacs.map(f => f.val), 
      backgroundColor: sortedFacs.map((_, i) => barColors[i % barColors.length]), 
      borderRadius: 6, borderWidth: 0 
    }]
  };

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: { color: '#37474f', anchor: 'end', align: 'top', font: { weight: 'bold', size: 14.5 } }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#eceff1' }, ticks: { font: { size: 13.5 } } },
      x: { grid: { display: false }, ticks: { font: { size: 13.5 } } }
    }
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
          <div className="page-header">
            <button style={{marginRight: 0}} className="back-btn" onClick={onBack}>← Вернуться к списку</button>

            <h1>{titleText}</h1>
            <div className="dropdown-wrapper" ref={dropdownRef}>
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
              <h3>Распределение студентов по факультетам</h3>
              <div className="canvas-container">
                <Bar data={barData} options={barOptions} plugins={[customBgPlugin]} ref={barRef} />
              </div>
              <button className="download-btn" onClick={() => downloadChart(barRef, 'faculty_chart.png')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              </button>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-block">
              <h4>Состояние комнат</h4>
              <div className="dynamic-stat-list">
                <div className="stat-line"><span>Полностью занятые:</span> <span className="stat-val" style={{ color: '#e53935' }}>{agg.occupied}</span></div>
                <div className="stat-line"><span>Частично занятые:</span> <span className="stat-val" style={{ color: '#ffb300' }}>{agg.partially}</span></div>
                <div className="stat-line"><span>Свободные:</span> <span className="stat-val" style={{ color: '#43a047' }}>{agg.free}</span></div>
                <div className="stat-line"><span>Всего студентов:</span> <span className="stat-val">{agg.totalStudents}</span></div>
              </div>
            </div>

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

            <div className="stat-block">
              <h4>Дополнительная информация</h4>
              <div className="dynamic-stat-list">
                <div className="stat-line"><span>Всего комнат (фонд):</span> <span className="stat-val">{agg.totalRooms}</span></div>
                <div className="stat-line"><span>Общая заполненность (по комнатам):</span> <span className="stat-val">{agg.totalRooms > 0 ? Math.round(((agg.occupied + agg.partially) / agg.totalRooms) * 100) : 0}%</span></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Dashboard;