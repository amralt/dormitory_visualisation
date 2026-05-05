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
    const loadSearch = async () => {
      const query = peopleSearch.trim();
      if (!query) {
        setFilteredPeople([]);
        setShowPeopleDropdown(false);
        return;
      }
      try {
        const results = await searchStudents(query);
        setFilteredPeople(results);
        setShowPeopleDropdown(results.length > 0);
      } catch (err) {
        console.error('Ошибка поиска:', err);
        setFilteredPeople([]);
        setShowPeopleDropdown(false);
      }
    };
    const timer = setTimeout(loadSearch, 300);
    return () => clearTimeout(timer);
  }, [peopleSearch]);

  // Все факультеты (departments) из загруженной статистики видимых общежитий
  const allFaculties = Array.from(
    new Set(
      Object.values(dormsData).flatMap(data => Object.keys(data.departments_stats || {}))
    )
  ).sort();

  // Фильтрация общежитий по выбранным факультетам (должен быть хотя бы один студент с таким факультетом)
  const filteredDorms = visibleDorms.filter(name => {
    const data = dormsData[name];
    if (!data) return false;
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
        <h1 className="page-title">Сводка по общежитиям</h1>

        {filteredDorms.length === 0 && (
          <p style={{ textAlign: 'center', color: '#e57373', fontSize: '18px' }}>
            Нет общежитий, соответствующих фильтрам.
          </p>
        )}

        <div className="cards-grid">
          {filteredDorms.map(name => {
            const data = dormsData[name];
            if (!data) return null;
            const total = data.total_rooms;
            const occupied = data.occupied_rooms;
            const partially = data.partially_occupied;
            const free = data.free_rooms;
            const totalStudents = data.total_students;
            return (
              <div key={name} className="dorm-card">
                <div className="card-header-dorm">
                  <span>Общежитие {name}</span>
                </div>
                <div className="card-body-dorm">
                  <div className="card-stats">
                    <div className="faculties-block">
                      <div className="stat-label" style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>
                        Факультеты:
                      </div>
                      {Object.entries(data.departments_stats || {}).map(([facName, count]) => (
                        <div key={facName} className="fac-item">
                          <span>{facName}:</span> <strong>{count} чел.</strong>
                        </div>
                      ))}
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Всего комнат:</span>
                      <span className="stat-val">{total}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Занято (полностью):</span>
                      <span className="stat-val" style={{ color: '#e53935' }}>{occupied}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Частично занято:</span>
                      <span className="stat-val" style={{ color: '#ffb300' }}>{partially}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Свободно:</span>
                      <span className="stat-val" style={{ color: '#43a047' }}>{free}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Всего студентов:</span>
                      <span className="stat-val">{totalStudents}</span>
                    </div>
                  </div>
                </div>
                <div className="card-footer-dorm">
                  <button className="go-btn" onClick={() => onCardClick(name)}>
                    Перейти
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
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