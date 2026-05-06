import React, { useState, useEffect } from 'react';
import { fetchDormitories, fetchDormitoryStats, searchStudents } from './api';
import Header from '../components/Header';
import SearchInput from '../components/SearchInput';
import FilterDropdown from '../components/FilterDropdown';

const CampusCards = ({ onCardClick, onStatClick, onDownloadClick, onLogout, onPersonClick, userName }) => {
  const [peopleSearch, setPeopleSearch] = useState('');
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [showPeopleDropdown, setShowPeopleDropdown] = useState(false);
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [expandedFaculties, setExpandedFaculties] = useState({});
  const toggleFaculties = (dormName) => {
  setExpandedFaculties(prev => ({ ...prev, [dormName]: !prev[dormName] }));
};
  const [showFilter, setShowFilter] = useState(false);
  const [dormsData, setDormsData] = useState({});       // { dormName: stats }
  const [visibleDorms, setVisibleDorms] = useState([]);  // массив имён видимых общежитий
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Загружаем список общежитий, фильтруем visible = true
  // 2. Для каждого видимого общежития загружаем статистику
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // Получаем список всех общежитий
        const allDorms = await fetchDormitories();
        // Отбираем только те, у которых visible === true
        const visible = allDorms.filter(d => d.visible === true).map(d => d.name);
        setVisibleDorms(visible);

        // Загружаем статистику для каждого видимого общежития
        const statsPromises = visible.map(async (name) => {
          try {
            const stats = await fetchDormitoryStats(name);
            return { name, stats };
          } catch (err) {
            console.error(`Ошибка загрузки статистики для общежития ${name}:`, err);
            return { name, stats: null };
          }
        });
        const results = await Promise.all(statsPromises);
        const dataMap = {};
        results.forEach(({ name, stats }) => {
          if (stats) dataMap[name] = stats;
        });
        setDormsData(dataMap);
      } catch (err) {
        console.error(err);
        setError('Не удалось загрузить список общежитий');
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  // Глобальный поиск студентов (без изменений)
  useEffect(() => {
  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const allDorms = await fetchDormitories();
      // Берём ВСЕ общежития, независимо от visible
      const allDormNames = allDorms.map(d => d.name);
      setVisibleDorms(allDormNames);

      const statsPromises = allDormNames.map(async (name) => {
        try {
          const stats = await fetchDormitoryStats(name);
          return { name, stats };
        } catch (err) {
          console.error(`Ошибка загрузки статистики для общежития ${name}:`, err);
          return { name, stats: null };
        }
      });
      const results = await Promise.all(statsPromises);
      const dataMap = {};
      results.forEach(({ name, stats }) => {
        // Сохраняем даже null — потом подставим нули
        dataMap[name] = stats;
      });
      setDormsData(dataMap);
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить список общежитий');
    } finally {
      setLoading(false);
    }
  };
  loadAll();
}, []);

  // Все факультеты (departments) из загруженной статистики видимых общежитий
  const allFaculties = Array.from(
    new Set(
      Object.values(dormsData).flatMap(data => Object.keys(data.departments_stats || {}))
    )
  ).sort();

  // Фильтрация общежитий по выбранным факультетам (должен быть хотя бы один студент с таким факультетом)
  const filteredDorms = visibleDorms.filter(name => {
  let originalData = dormsData[name];
const isVisible = originalData !== null; // если данных нет – visible false
let data;
if (!originalData) {
  data = {
    total_rooms: 0,
    occupied_rooms: 0,
    partially_occupied: 0,
    free_rooms: 0,
    total_students: 0,
    departments_stats: {}
  };
} else {
  data = { ...originalData };
  if (!isVisible) {
    data.total_rooms = 0;
    data.occupied_rooms = 0;
    data.partially_occupied = 0;
    data.free_rooms = 0;
  }
}

  if (selectedFaculties.length === 0) return true;
  return selectedFaculties.some(fac => data.departments_stats?.[fac] > 0);
});

  const handlePersonClick = (student) => {
    setPeopleSearch('');
    setShowPeopleDropdown(false);
    if (onPersonClick) {
      onPersonClick(student.dormitory, student.room);
    }
  };

  const toggleFaculty = (fac) => {
    setSelectedFaculties(prev =>
      prev.includes(fac) ? prev.filter(f => f !== fac) : [...prev, fac]
    );
  };

  const clearFilters = () => setSelectedFaculties([]);

  if (loading) return <div className="loading-spinner">Загрузка данных...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
<>

      <main className="main-content-cards">
        <h1 className="page-title" style={{ color: 'black', marginBottom: '1.5rem', marginTop: '0rem', }}>Общежития НГУ</h1>

        {filteredDorms.length === 0 && (
          <p style={{ textAlign: 'center', color: '#e57373', fontSize: '18px' }}>
            Нет общежитий, соответствующих фильтрам.
          </p>
        )}

        <div 
  className="cards-grid" 
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    alignItems: 'start'
  }}
>
          {filteredDorms.map(name => {
  let originalData = dormsData[name];
  let data;
  if (!originalData) {
    data = {
      total_rooms: 0,
      occupied_rooms: 0,
      partially_occupied: 0,
      free_rooms: 0,
      total_students: 0,
      departments_stats: {}
    };
  } else {
    data = { ...originalData };
    // если данных нет (originalData === null) мы уже обработали, здесь данные есть
    // но если видимость ложная (раньше была логика isVisible, сейчас не нужна)
    // Для пустых БД можно позже обнулить, но сейчас просто используем as is
  }

  // Определяем, есть ли комнаты (и вообще данные не пустые)
  const hasRooms = data.total_rooms > 0;

  return (
    <div 
      key={name} 
      className="dorm-card" 
      style={{
        opacity: hasRooms ? 1 : 0.6,
        backgroundColor: hasRooms ? 'var(--card-bg)' : '#f0f0f0',
        transition: 'none',
        cursor: hasRooms ? 'pointer' : 'default',
        transform: 'none',
        pointerEvents: hasRooms ? 'auto' : 'none'
      }}
    >
      <div className="card-header-dorm">
        <span>{name}</span>
      </div>
      <div className="card-body-dorm">
        <div className="card-stats">
          <div className="faculties-block" style={{ minHeight: '170px' }}>
            <div className="stat-label" style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>
              Факультеты:
            </div>
            {(() => {
              const faculties = Object.entries(data.departments_stats || {});
              const sorted = [...faculties].sort((a, b) => b[1] - a[1]);
              const isExpanded = expandedFaculties[name];
              const visibleFaculties = isExpanded ? sorted : sorted.slice(0, 3);
              const hasMore = sorted.length > 3;

              if (faculties.length === 0) {
                return <div style={{ color: '#999', fontSize: '13px', padding: '4px 0' }}>Нет данных</div>;
              }

              return (
                <>
                  {visibleFaculties.map(([facName, count]) => (
                    <div key={facName} className="fac-item">
                      <span>{facName}:</span> <strong>{count} чел.</strong>
                    </div>
                  ))}
                  {hasMore && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button
                        onClick={() => toggleFaculties(name)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#666',
                          fontSize: '13px',
                          padding: '4px 8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {isExpanded ? '▲ Скрыть' : '▼ Показать все'}
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <div className="stat-item" style={{ marginTop: '3px' }}>
            <span className="stat-label">Всего студентов:</span>
            <span className="stat-val">{data.total_students}</span>
          </div>

          <div style={{ marginTop: '4px' }}></div>

          <div className="stat-item">
            <span className="stat-label">Всего комнат:</span>
            <span className="stat-val">{data.total_rooms}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Занято (полностью):</span>
            <span className="stat-val" style={{ color: '#e53935' }}>{data.occupied_rooms}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Частично занято:</span>
            <span className="stat-val" style={{ color: '#ffb300' }}>{data.partially_occupied}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Свободно:</span>
            <span className="stat-val" style={{ color: '#43a047' }}>{data.free_rooms}</span>
          </div>
        </div>
      </div>
      <div className="card-footer-dorm">
        <button 
          className="go-btn" 
          onClick={() => hasRooms && onCardClick(name)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '8px 0',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: hasRooms ? 'pointer' : 'default',
            backgroundColor: hasRooms ? undefined : '#cccccc'
          }}
        >
          Перейти
        </button>
      </div>
    </div>
  );
})}
        </div>
      </main>
    </>
  );
};

export default CampusCards;