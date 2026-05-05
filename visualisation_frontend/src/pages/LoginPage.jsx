import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { filterResidents } from './api';
import './Download.css';

const Download = ({ onBack, onLogout }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Список студентов');

    worksheet.columns = [
      { header: 'ФИО', key: 'fiz_lico', width: 35 },
      { header: 'Общежитие', key: 'dormitory', width: 18 },
      { header: 'Комната', key: 'room', width: 12 },
      { header: 'Факультет', key: 'department', width: 25 },
      { header: 'Организация', key: 'organisation', width: 20 },
      { header: 'Категория', key: 'resident_category', width: 25 },
    ];

    students.forEach(student => {
      worksheet.addRow({
        fiz_lico: student.fiz_lico || '',
        dormitory: student.dormitory || '',
        room: student.room || '',
        department: student.department || '',
        organisation: student.organisation || '',
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
    anchor.download = `studgorodok_export_${new Date().toLocaleDateString()}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <div className="loading-spinner">Загрузка данных...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="download-page">
      <main className="download-main">
        <h1 className="download-title">Выгрузка базы данных</h1>
        <p className="download-subtitle">Просмотр и экспорт актуального списка проживающих</p>

        <div className="export-btn-container">
          <button className="apply-btn" onClick={handleExportExcel}>
            📥 Сгенерировать и скачать Excel
          </button>
        </div>

        <div className="preview-table-wrapper">
          <table className="download-table">
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Общежитие</th>
                <th>Комната</th>
                <th>Факультет</th>
                <th>Категория</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={idx} className="table-row-hover">
                  <td data-label="ФИО">{s.fiz_lico || '—'}</td>
                  <td data-label="Общежитие">{s.dormitory || '—'}</td>
                  <td data-label="Комната">{s.room || '—'}</td>
                  <td data-label="Факультет">{s.department || '—'}</td>
                  <td data-label="Категория">{s.resident_category || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="text-btn back-btn" onClick={onBack}>
          ← Вернуться в меню
        </button>
      </main>
    </div>
  );
};

export default Download;