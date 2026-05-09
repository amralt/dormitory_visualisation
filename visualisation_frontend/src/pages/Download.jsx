import React, { useState, useEffect, useMemo, useRef } from 'react';
import ExcelJS from 'exceljs';
import { filterResidents } from './api';
import './Download.css';

// Компонент выпадающего списка с множественным выбором
const MultiSelectDropdown = ({ options, selectedValues, onChange, placeholder, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCheckboxChange = (value) => {
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newSelected);
  };

  const displayText = selectedValues.length === 0
    ? placeholder
    : selectedValues.length === 1
    ? selectedValues[0]
    : `Выбрано: ${selectedValues.length}`;

  return (
    <div className="multi-select-container" ref={containerRef}>
      <div className="multi-select-header" onClick={() => setIsOpen(!isOpen)}>
        <span>{displayText}</span>
        <span className="arrow">▼</span>
      </div>
      {isOpen && (
        <div className="multi-select-dropdown">
          {options.map(option => (
            <label key={option} className="multi-select-item">
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={() => handleCheckboxChange(option)}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const Download = ({ onBack, onLogout, selectedDormitory }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Фильтры как массивы
  const [facultyFilters, setFacultyFilters] = useState([]);
  const [dormFilters, setDormFilters] = useState([]);
  const [formFilters, setFormFilters] = useState([]);

  useEffect(() => {
    console.log(selectedDormitory);
    const loadData = async () => {
      setLoading(true);
      try {
        const residents = await filterResidents({});
        setStudents(residents);
      } catch (err) {
        setError('Не удалось загрузить список студентов');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
  // Сохраняем исходное значение overflow
  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';   // отключаем скролл на body

  return () => {
    document.body.style.overflow = originalOverflow; // восстанавливаем
  };
}, []);

  const uniqueFaculties = useMemo(() => {
    const faculties = students.map(s => s.department).filter(Boolean);
    return [...new Set(faculties)];
  }, [students]);

  const uniqueDorms = useMemo(() => {
    const dorms = students.map(s => s.dormitory).filter(Boolean);
    return [...new Set(dorms)];
  }, [students]);

  const uniqueForms = useMemo(() => {
    const forms = students.map(s => s.resident_category).filter(Boolean);
    return [...new Set(forms)];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchFaculty = facultyFilters.length === 0 ||
        (student.department && facultyFilters.includes(student.department));
      const matchDorm = dormFilters.length === 0 ||
        (student.dormitory && dormFilters.includes(student.dormitory));
      const matchForm = formFilters.length === 0 ||
        (student.resident_category && formFilters.includes(student.resident_category));
      return matchFaculty && matchDorm && matchForm;
    });
  }, [students, facultyFilters, dormFilters, formFilters]);

  const resetFilters = () => {
    setFacultyFilters([]);
    setDormFilters([]);
    setFormFilters([]);
  };

  const handleExportExcel = async () => {
    if (filteredStudents.length === 0) {
      alert('Нет данных для экспорта!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Студенты');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'ФИО Студента', key: 'fiz_lico', width: 35 },
      { header: 'Факультет', key: 'department', width: 20 },
      { header: 'Общежитие', key: 'dormitory', width: 12 },
      { header: 'Комната', key: 'room', width: 10 },
      { header: 'Форма обучения', key: 'resident_category', width: 18 },
    ];

    filteredStudents.forEach((student, idx) => {
      worksheet.addRow({
        id: idx + 1,
        fiz_lico: student.fiz_lico || '',
        department: student.department || '',
        dormitory: student.dormitory || '',
        room: student.room || '',
        resident_category: student.resident_category || '',
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const facultySuffix = facultyFilters.length === 0 ? 'все_факультеты' : 
                          (facultyFilters.length === 1 ? facultyFilters[0] : 'несколько');
    const dormSuffix = dormFilters.length === 0 ? 'все_общежития' : 
                       (dormFilters.length === 1 ? `общ_${dormFilters[0]}` : 'несколько');
    anchor.download = `Студенты_${facultySuffix}_${dormSuffix}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <div className="loading-spinner">Загрузка данных...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="download-page">
      <main className="download-main-content">
        <div className="header-row">
          <button className="back-btn" onClick={onBack}>← Вернуться к статистике</button>
          <h1 className="page-title">Выгрузка базы данных</h1>
        </div>

        <div className="control-panel">
          <div className="filters-group">
            <div className="filter-item">
              <label>Факультет</label>
              <MultiSelectDropdown
                options={uniqueFaculties}
                selectedValues={facultyFilters}
                onChange={setFacultyFilters}
                placeholder="Все факультеты"
              />
            </div>
            <div className="filter-item">
              <label>Общежитие</label>
              <MultiSelectDropdown
                options={uniqueDorms}
                selectedValues={dormFilters}
                onChange={setDormFilters}
                placeholder="Все общежития"
              />
            </div>
            <div className="filter-item">
              <label>Форма обучения</label>
              <MultiSelectDropdown
                options={uniqueForms}
                selectedValues={formFilters}
                onChange={setFormFilters}
                placeholder="Все формы"
              />
            </div>
            <button className="reset-filters-btn" onClick={resetFilters}>
              Сбросить фильтры
            </button>
          </div>
          <button className="download-excel-btn" onClick={handleExportExcel}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Скачать Excel (.xlsx)
          </button>
        </div>

        <div className="table-container">
          <div className="table-wrapper">
            <table className="preview-table">
              <thead>
                <tr className="headers-row">
                  <th>ID</th>
                  <th>ФИО Студента</th>
                  <th>Факультет</th>
                  <th>Общежитие</th>
                  <th>Комната</th>
                  <th>Форма обучения</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      По заданным фильтрам студентов не найдено
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => (
                    <tr key={idx} className="table-row-hover">
                      <td>{idx + 1}</td>
                      <td><strong>{student.fiz_lico || ''}</strong></td>
                      <td>{student.department || ''}</td>
                      <td>{student.dormitory || ''}</td>
                      <td>{student.room || ''}</td>
                      <td>{student.resident_category || ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Download;