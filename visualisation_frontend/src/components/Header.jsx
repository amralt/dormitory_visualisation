import React, { useState, useEffect } from 'react';
import { fetchDormitories, fetchDormitoryStats, searchStudents } from '../pages/api';


const Header = ({
  userName,
  onLogout,
  onStatClick,
  onDownloadClick,
  onPersonClick,
  onLogoClick,
}) => {
  const [peopleSearch, setPeopleSearch] = useState('');
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [showPeopleDropdown, setShowPeopleDropdown] = useState(false);
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [dormsData, setDormsData] = useState({});
  const [loadingFaculties, setLoadingFaculties] = useState(true);

  // Загрузка списка общежитий и их статистики (только visible)
  useEffect(() => {
    const loadData = async () => {
      try {
        const allDorms = await fetchDormitories();
        const visible = allDorms.filter(d => d.visible).map(d => d.name);
        const statsPromises = visible.map(async name => {
          try {
            const stats = await fetchDormitoryStats(name);
            return { name, stats };
          } catch (err) {
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
        console.error('Ошибка загрузки данных общежитий для фильтров:', err);
      } finally {
        setLoadingFaculties(false);
      }
    };
    loadData();
  }, []);

  // Глобальный поиск студентов
  useEffect(() => {
    const query = peopleSearch.trim();
    if (!query) {
      setFilteredPeople([]);
      setShowPeopleDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchStudents(query);
        setFilteredPeople(results);
        setShowPeopleDropdown(results.length > 0);
      } catch (err) {
        console.error('Ошибка поиска:', err);
        setFilteredPeople([]);
        setShowPeopleDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [peopleSearch]);

  // Все факультеты из видимых общежитий
  const allFaculties = Array.from(
    new Set(
      Object.values(dormsData).flatMap(data =>
        Object.keys(data.departments_stats || {})
      )
    )
  ).sort();

  // Обработчики
  const toggleFaculty = fac => {
    setSelectedFaculties(prev =>
      prev.includes(fac) ? prev.filter(f => f !== fac) : [...prev, fac]
    );
  };

  const clearFilters = () => setSelectedFaculties([]);

  const handlePersonClick = student => {
    setPeopleSearch('');
    setShowPeopleDropdown(false);
    if (onPersonClick) {
      onPersonClick(student.dormitory, student.room);
    }
  };

  return (
    <header className="top-navbar">
      <div className="nav-left" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
        <div className="n-star-logo">
          <span className="n-char">N</span>
          <span className="star-char">*</span>
        </div>
        <span>СтудГородок</span>
      </div>

      <div className="search-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
          <div className="search-input-wrapper" style={{ position: 'relative' }}>
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Поиск проживающего (ФИО)..."
              value={peopleSearch}
              onChange={e => setPeopleSearch(e.target.value)}
            />
            {showPeopleDropdown && (
              <div className="search-results-dropdown" style={{ display: 'block' }}>
                {filteredPeople.map((student, idx) => (
                  <div
                    key={idx}
                    className="search-result-item"
                    onClick={() => handlePersonClick(student)}
                  >
                    <div className="res-name">{student.fiz_lico}</div>
                    <div className="res-details">
                      <span>{student.department} | {student.organisation}</span>
                      <span className="res-dorm-badge">
                        Общ. {student.dormitory} | {student.room}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="header-filter-wrapper" style={{ position: 'relative' }}>
            <button className="filter-btn" onClick={() => setShowFilter(!showFilter)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Фильтры
            </button>
            {showFilter && (
              <div className="header-filter-dropdown show">
                <b>Выберите факультеты:</b>
                {loadingFaculties ? (
                  <p>Загрузка...</p>
                ) : (
                  allFaculties.map(fac => (
                    <label key={fac}>
                      <input
                        type="checkbox"
                        checked={selectedFaculties.includes(fac)}
                        onChange={() => toggleFaculty(fac)}
                      />
                      {' '}{fac}
                    </label>
                  ))
                )}
                {selectedFaculties.length > 0 && (
                  <button
                    onClick={clearFilters}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#1565C0',
                      cursor: 'pointer',
                      marginTop: '8px',
                      fontWeight: 'bold',
                    }}
                  >
                    Сбросить все
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="nav-right">
        <button className="stat-btn" onClick={onDownloadClick}>
          СКАЧАТЬ ТАБЛИЦУ
        </button>
        <button className="stat-btn" onClick={onStatClick}>
          СТАТИСТИКА
        </button>
        {userName && (
          <div className="user-profile">
            <span className="user-name-text">{userName}</span>
          </div>
        )}
        <button className="logout-btn-icon" title="Выйти" onClick={onLogout}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;