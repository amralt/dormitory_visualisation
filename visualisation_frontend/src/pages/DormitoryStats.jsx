import React, { useState, useEffect, useMemo } from 'react';
import { filterResidents } from './api';
import './DormitoryStats.css';

const DormitoryStats = ({ dormId, onBack, onGoToDashboard, onDownloadClick, onLogout, onOpenMap, userName }) => {
  const [floorStats, setFloorStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState([]);

  // Загружаем всех студентов общежития и группируем по этажам (код без изменений)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const residents = await filterResidents({ dormitory: dormId });
        const floorsMap = new Map();
        residents.forEach(res => {
          const roomNum = res.room;
          if (!roomNum) return;
          const floor = parseInt(roomNum.charAt(0), 10);
          if (isNaN(floor)) return;
          if (!floorsMap.has(floor)) {
            floorsMap.set(floor, { residents: [], rooms: new Map() });
          }
          const floorData = floorsMap.get(floor);
          floorData.residents.push(res);
          if (!floorData.rooms.has(roomNum)) {
            floorData.rooms.set(roomNum, { students: [] });
          }
          floorData.rooms.get(roomNum).students.push(res);
        });
        const stats = Array.from(floorsMap.entries()).map(([floor, data]) => {
          let totalSpots = 0;
          let occupiedSpots = data.residents.length;
          let fullRooms = 0, partRooms = 0, freeRooms = 0;
          const rooms = Array.from(data.rooms.values());
          rooms.forEach(room => {
            const count = room.students.length;
            if (count === 0) freeRooms++;
            else if (count === 1) partRooms++;
            else fullRooms++;
            totalSpots += 2;
          });
          let male = 0, female = 0;
          data.residents.forEach(r => {
            const name = r.fiz_lico || '';
            if (name.endsWith('а') || name.endsWith('я') || name.endsWith('на')) female++;
            else male++;
          });
          return {
            floor,
            occupied: occupiedSpots,
            total: totalSpots,
            full: fullRooms,
            part: partRooms,
            free: freeRooms,
            male, female,
          };
        }).sort((a,b) => a.floor - b.floor);
        setFloorStats(stats);
      } catch (err) {
        console.error(err);
        setError('Не удалось загрузить данные по этажам');
      } finally {
        setLoading(false);
      }
    };
    if (dormId) loadData();
  }, [dormId]);

  if (loading) return <div className="loading-spinner">Загрузка этажей...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    // МЕНЯЕМ ОБЁРТКУ: теперь как в Download – download-page и download-main-content
    <div className="download-page">
      <main className="download-main-content">
        {/* Блок заголовка и кнопки – теперь как в Download (header-row) */}
        <div className="header-row">
          <button className="back-btn" onClick={onBack}>← Вернуться на главную страницу</button>
          <h1 className="page-title">Информация по {dormId}</h1>
        </div>

        {/* Контейнер с таблицей – оставляем твои классы, но можно и унифицировать */}
        <div className="table-container">
          <div className="table-wrapper">
            <table className="dorm-table">
              <thead>
                <tr>
                  <th>Этаж</th>
                  <th>Места (Занято / Всего)</th>
                  <th>Комнаты (Полн / Част / Своб)</th>
                  <th>Мужчины / Женщины</th>
                  <th>Карта</th>
                </tr>
              </thead>
              <tbody>
                {floorStats.map(data => (
                  <tr key={data.floor}>
                    <td className="td-floor">{data.floor}</td>
                    <td><b>{data.occupied}</b> / {data.total}</td>
                    <td>
                      <span className="room-badge r-full">{data.full}</span>
                      <span className="room-badge r-part">{data.part}</span>
                      <span className="room-badge r-free">{data.free}</span>
                    </td>
                    <td>
                      <span className="gender-badge g-male">М: {data.male}</span>
                      <span className="gender-badge g-female">Ж: {data.female}</span>
                    </td>
                    <td>
                      <button 
                        className="go-to-floor-btn" 
                        onClick={() => onOpenMap && onOpenMap(dormId, data.floor)}
                        title="Открыть карту этажа"
                      >
                        →
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Строка «ВСЕГО» */}
                {floorStats.length > 0 && (
                  <tr>
                    <td className="td-floor">Всего</td>
                    <td>
                      <b>{floorStats.reduce((sum, f) => sum + f.occupied, 0)}</b> /{' '}
                      {floorStats.reduce((sum, f) => sum + f.total, 0)}
                    </td>
                    <td>
                      <span className="room-badge r-full">
                        {floorStats.reduce((sum, f) => sum + f.full, 0)}
                      </span>
                      <span className="room-badge r-part">
                        {floorStats.reduce((sum, f) => sum + f.part, 0)}
                      </span>
                      <span className="room-badge r-free">
                        {floorStats.reduce((sum, f) => sum + f.free, 0)}
                      </span>
                    </td>
                    <td>
                      <span className="gender-badge g-male">
                        М: {floorStats.reduce((sum, f) => sum + f.male, 0)}
                      </span>
                      <span className="gender-badge g-female">
                        Ж: {floorStats.reduce((sum, f) => sum + f.female, 0)}
                      </span>
                    </td>
                    <td>{/* Пустая ячейка */}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DormitoryStats;