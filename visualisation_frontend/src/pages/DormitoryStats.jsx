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

  // Загружаем всех студентов общежития и группируем по этажам
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Получаем всех жильцов данного общежития
        const residents = await filterResidents({ dormitory: dormId });
        // Группировка по этажам (извлекаем этаж из номера комнаты – предполагаем, что первая цифра)
        const floorsMap = new Map(); // key: floor, value: { residents, rooms: Map<room, {capacity?, students}> }
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
        // Преобразуем в массив статистики по этажам
        const stats = Array.from(floorsMap.entries()).map(([floor, data]) => {
          let totalSpots = 0;
          let occupiedSpots = data.residents.length;
          let fullRooms = 0, partRooms = 0, freeRooms = 0;
          // Для расчёта вместимости нужно знать capacity – в API нет, поэтому используем только занятость
          // Можно вычислить количество мест как максимум студентов в комнате по данному этажу, но это неточно.
          // Для демонстрации сделаем допущение, что каждая комната имеет вместимость 2 (или оставим только occupied / spots неизвестно)
          // Покажем только занятые места и количество комнат разных типов (если студентов 0 – свободная, если >0 и < capacity – частичная, если == capacity – полная)
          // Так как capacity неизвестно, будем считать, что комната полная, если в ней 2 и более студента (условно)
          const rooms = Array.from(data.rooms.values());
          rooms.forEach(room => {
            const count = room.students.length;
            if (count === 0) freeRooms++;
            else if (count === 1) partRooms++; // предположим, что max 2
            else fullRooms++;
            totalSpots += 2; // условно 2 места
          });
          // Пол (грубо по последней букве ФИО)
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

  // Глобальный поиск (используем filterResidents с поиском по ФИО – не поддерживается, используем searchStudents из api)
  // Для простоты можно оставить только локальный фильтр по факультетам через уже загруженных resident'ов
  // Здесь опустим глобальный поиск, так как в DormMap он уже есть

  const toggleFaculty = (fac) => {
    setSelectedFaculties(prev => 
      prev.includes(fac) ? prev.filter(f => f !== fac) : [...prev, fac]
    );
  };

  if (loading) return <div className="loading-spinner">Загрузка этажей...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="dashboard-container">
      

      <div className="sub-header">
        <button className="back-btn" onClick={onBack}>← Вернуться к списку</button>
        <h1 className="page-title">Сводка по этажам: Общежитие №{dormId}</h1>
      </div>

      <div className="content-container">
        <div className="table-wrapper">
          <table className="dorm-table">
            <thead>
              <tr>
                <th>Этаж</th>
                <th>Места (Занято / Всего)</th>
                <th>Комнаты (Полн / Част / Своб)</th>
                <th>Мужчины / Женщины</th>
                <th>План</th>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DormitoryStats;