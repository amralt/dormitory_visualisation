import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { fetchDormitoryStats } from './api';

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

// const dormitoryList = ['Общежитие 3', 'Общежитие 2', 'Общежитие 3 1А', 'Общежитие 1Б'];
const dormitoryList = ['Общежитие 2'];

const Dashboard = ({ dormId, onBack, onLogout, onDownloadClick }) => {
  const dropdownRef = useRef(null);
  const pieRef = useRef(null);
  const barRef = useRef(null);

  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedDorms, setSelectedDorms] = useState([]);
  const [draftSelected, setDraftSelected] = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загружаем статистику для всех общежитий при монтировании
  useEffect(() => {
    const loadAllStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.all(
          dormitoryList.map(async (id) => {
            try {
              const stats = await fetchDormitoryStats(id);
              // TODO: написать в бекенде обработчик найденных или ненайденных общаг. чтобы не показывать в списке общаги которых на самом деле нет.
              console.log(id);
              return { id, stats };
            } catch (err) {
              console.error(`Ошибка загрузки ${id}:`, err);
              return { id, stats: null };
            }
          })
        );
        const map = {};
        results.forEach(({ id, stats }) => {
          if (stats) map[id] = stats;
        });
        setStatsMap(map);
      } catch (err) {
        setError('Не удалось загрузить статистику');
      } finally {
        setLoading(false);
      }
    };
    loadAllStats();
  }, []);

  // Установка выбранных общежитий при изменении dormId или загрузке данных
  useEffect(() => {
    if (dormId && statsMap[dormId]) {
      setSelectedDorms([dormId]);
      setDraftSelected([dormId]);
    } else if (Object.keys(statsMap).length > 0) {
      setSelectedDorms(dormitoryList);
      setDraftSelected(dormitoryList);
    }
  }, [dormId, statsMap]);

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

  let titleText = selectedDorms.length === dormitoryList.length ? "Общая статистика: Студгородок" :
                  selectedDorms.length === 1 ? `Статистика: Общежитие №${selectedDorms[0]}` :
                  selectedDorms.length === 0 ? "Нет выбранных общежитий" : `Суммарная статистика (${selectedDorms.length} общ.)`;

  let btnText = selectedDorms.length === 1 ? `Общежитие №${selectedDorms[0]} ▼` :
                selectedDorms.length === 0 ? "Выберите общежития ▼" :
                selectedDorms.length === dormitoryList.length ? "Весь Студгородок ▼" : `Выбрано: ${selectedDorms.length} общ. ▼`;

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
      <header className="top-navbar">
        <div className="nav-left" onClick={onBack} style={{ cursor: 'pointer' }}>
          <div className="n-star-logo"><span className="n-char">N</span><span className="star-char">*</span></div>
          <span>СтудГородок</span>
        </div>
        <div className="search-container">
          <div className="search-input-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" className="search-input" placeholder="Поиск проживающего (ФИО)..." />
          </div>
          <button className="filter-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            Фильтры
          </button>
        </div>
        <div className="nav-right">
          <button className="stat-btn" onClick={onDownloadClick}>СКАЧАТЬ ТАБЛИЦУ</button>
          <button className="stat-btn active">СТАТИСТИКА</button>
          <div className="user-profile">
            <div className="user-avatar">ПН</div>
            <span className="user-name">Пушкарев Николай</span>
          </div>
          <button className="logout-btn-icon" title="Выйти" onClick={onLogout}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </header>

      <div className="app-container">
        <nav className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <span className="menu-text" style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>НАВИГАЦИЯ</span>
            <button className="toggle-btn" onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          </div>
          <ul className="menu-list">
            <li className="menu-item" onClick={onBack}>
              <div className="menu-icon">📍</div><span className="menu-text">Назад к списку</span>
            </li>
            <li className="menu-item active">
              <div className="menu-icon">📊</div><span className="menu-text">Дашборды</span>
            </li>
          </ul>
        </nav>

        <main className="main-content">
          <div className="page-header">
            <h1>{titleText}</h1>
            <div className="dropdown-wrapper" ref={dropdownRef}>
              <button className="dropdown-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                {btnText}
              </button>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-actions-top">
                    <button className="text-btn" onClick={() => setDraftSelected(dormitoryList)}>Выбрать все</button>
                    <button className="text-btn" onClick={() => setDraftSelected([])}>Сбросить</button>
                  </div>
                  <div className="checkbox-grid">
                    {dormitoryList.map(id => (
                      <label key={id} className="checkbox-item">
                        <input 
                          type="checkbox" 
                          checked={draftSelected.includes(id)}
                          onChange={(e) => {
                            if (e.target.checked) setDraftSelected([...draftSelected, id]);
                            else setDraftSelected(draftSelected.filter(d => d !== id));
                          }}
                        /> Общ. №{id}
                      </label>
                    ))}
                  </div>
                  <button className="apply-btn" onClick={() => {
                    setSelectedDorms(draftSelected);
                    setIsDropdownOpen(false);
                  }}>Показать статистику</button>
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
              <span className="clickable-text">Подробные списки комнат ▶</span>
            </div>

            <div className="stat-block">
              <h4>Проживающие по факультетам</h4>
              <div className="dynamic-stat-list">
                {sortedFacs.length > 0 ? sortedFacs.map(f => (
                  <div key={f.label} className="stat-line"><span>{f.label}:</span> <span className="stat-val">{f.val} чел.</span></div>
                )) : <div className="stat-line"><span>Нет данных</span></div>}
              </div>
            </div>

            <div className="stat-block">
              <h4>Дополнительная информация</h4>
              <div className="dynamic-stat-list">
                <div className="stat-line"><span>Всего комнат (фонд):</span> <span className="stat-val">{agg.totalRooms}</span></div>
                <div className="stat-line"><span>Общая заполненность (по комнатам):</span> <span className="stat-val">{agg.totalRooms > 0 ? Math.round(((agg.occupied + agg.partially) / agg.totalRooms) * 100) : 0}%</span></div>
              </div>
              <span className="clickable-text">Список лиц с ОВЗ ▶</span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Dashboard;