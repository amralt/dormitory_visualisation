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
        const residents = await filterResidents({}); // без фильтров – все
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
      { header: 'ФИО', key: 'fiz_lico', width: 30 },
      { header: 'Общежитие', key: 'dormitory', width: 15 },
      { header: 'Комната', key: 'room', width: 15 },
      { header: 'Факультет', key: 'department', width: 20 },
      { header: 'Организация', key: 'organisation', width: 20 },
      { header: 'Категория', key: 'resident_category', width: 20 },
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

  const thStyle = { padding: '14px 12px', borderBottom: '2px solid #eee', color: '#666', fontWeight: '600', textAlign: 'left' };
  const tdStyle = { padding: '12px', borderBottom: '1px solid #f0f0f0', color: '#333' };

  if (loading) return <div className="loading-spinner">Загрузка данных...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="download-page">
      

      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Выгрузка базы данных</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Просмотр и экспорт актуального списка проживающих</p>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <button className="apply-btn" onClick={handleExportExcel}>
            📥 Сгенерировать и скачать Excel
          </button>
        </div>

        <div className="preview-table-container" style={{ maxHeight: '500px', overflowY: 'auto', overflowX: 'auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th style={thStyle}>ФИО</th>
                <th style={thStyle}>Общ.</th>
                <th style={thStyle}>Комната</th>
                <th style={thStyle}>Факультет</th>
                <th style={thStyle}>Категория</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={idx} className="table-row-hover">
                  <td style={tdStyle}>{s.fiz_lico || ''}</td>
                  <td style={tdStyle}>{s.dormitory || ''}</td>
                  <td style={tdStyle}>{s.room || ''}</td>
                  <td style={tdStyle}>{s.department || ''}</td>
                  <td style={tdStyle}>{s.resident_category || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="text-btn" onClick={onBack} style={{ display: 'block', margin: '30px auto' }}>
          ← Вернуться в меню
        </button>
      </main>
    </div>
  );
};

export default Download;