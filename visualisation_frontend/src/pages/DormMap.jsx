import React, { useState, useEffect, useRef, useCallback } from 'react';
import { filterResidents } from './api';
import './DormMap.css';

// Нормализация номера комнаты (убираем "/1" и т.п.)
const normalizeRoomId = (rawRoom) => {
  const cleaned = String(rawRoom).trim().split('/')[0].split(' ')[0];
  return cleaned;
};

const DormMap = ({ dormId, onBack, onGoToDashboard, onLogout, initialRoomId, onDownloadClick, userName }) => {
  // ===== Состояния =====
  const [currentFloor, setCurrentFloor] = useState(1);
  const [scale, setScale] = useState(1);
  const [pointX, setPointX] = useState(0);
  const [pointY, setPointY] = useState(0);
  const [panning, setPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [showGlobalDropdown, setShowGlobalDropdown] = useState(false);
  const [activeGlobalFaculties, setActiveGlobalFaculties] = useState([]);
  const [showGlobalFilterDropdown, setShowGlobalFilterDropdown] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [localFacultyFilter, setLocalFacultyFilter] = useState('all');
  const [svgContent, setSvgContent] = useState('');
  const [popupRoom, setPopupRoom] = useState(null);

  const [roomsData, setRoomsData] = useState([]);
  const [globalStudentsDB, setGlobalStudentsDB] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);

  // ===== Рефы =====
  const zoomLayerRef = useRef(null);
  const mapAreaRef = useRef(null);
  const globalSearchRef = useRef(null);
  const globalSearchContainerRef = useRef(null);   // для закрытия по клику вне
  const filterContainerRef = useRef(null);
  const currentFloorRef = useRef(1);
  const roomsDataRef = useRef([]);
  const selectedRoomIdRef = useRef(null);

  // Синхронизация рефов с актуальным состоянием
  useEffect(() => { roomsDataRef.current = roomsData; }, [roomsData]);
  useEffect(() => { selectedRoomIdRef.current = selectedRoomId; }, [selectedRoomId]);

  // ===== Загрузка данных жильцов из API =====
  useEffect(() => {
    if (!dormId) {
      setRoomsData([]);
      setGlobalStudentsDB([]);
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    setDataError(null);
    filterResidents({ dormitory: dormId })
      .then((residents) => {
        const roomMap = {};
        residents.forEach((r) => {
          const roomId = normalizeRoomId(r.room);
          if (!roomMap[roomId]) {
            roomMap[roomId] = { id: roomId, capacity: 2, students: [] };
          }
          roomMap[roomId].students.push({
            name: r.fiz_lico,
            fac: r.department,
            category: r.resident_category,
            contract: `${roomId}-${r.fiz_lico.split(' ')[0]}`,
          });
        });
        const roomsArray = Object.values(roomMap);
        setRoomsData(roomsArray);

        const flatList = [];
        roomsArray.forEach((room) => {
          room.students.forEach((s) => {
            flatList.push({
              name: s.name,
              dorm: dormId.replace('Общежитие ', ''),
              room: room.id,
              fac: s.fac,
              contract: s.contract,
            });
          });
        });
        setGlobalStudentsDB(flatList);
        setLoadingData(false);
      })
      .catch(() => {
        setDataError('Ошибка загрузки данных жильцов');
        setLoadingData(false);
      });
  }, [dormId]);

  // ===== Загрузка SVG этажа =====
  const loadFloor = useCallback(async (floor) => {
    try {
      const response = await fetch(`/map_${floor}.svg`);
      if (!response.ok) throw new Error('SVG not found');
      const svgText = await response.text();
      setSvgContent(svgText);
    } catch (error) {
      setSvgContent(`<div style="text-align:center; padding: 20px;"><h3>Ошибка загрузки map_${floor}.svg</h3></div>`);
    }
  }, []);

  // ===== Функция окраски комнат (использует рефы) =====
  const updateMapColors = useCallback(() => {
    document.querySelectorAll('.map-room').forEach(roomEl => {
      const roomId = roomEl.getAttribute('data-room');
      const roomData = roomsDataRef.current.find(r => r.id === roomId);
      roomEl.classList.remove('status-free', 'status-partial', 'status-full', 'status-selected');

      if (selectedRoomIdRef.current === roomId) {
        roomEl.classList.add('status-selected');
        return;
      }
      const occupied = roomData ? roomData.students.length : 0;
      const capacity = roomData ? roomData.capacity : 2;
      if (occupied === 0) roomEl.classList.add('status-free');
      else if (occupied < capacity) roomEl.classList.add('status-partial');
      else roomEl.classList.add('status-full');
    });
  }, []);

  // ===== prepareSVG (вставка данных о комнатах) =====
  const prepareSVG = useCallback(() => {
    if (!svgContent || !svgContent.includes('<svg')) return;
    setTimeout(() => {
      const roomIds = ["01","02","03","04","05","06","07","08","09","10","11","12","13","14","15"];
      let index = 0;
      const shapes = Array.from(document.querySelectorAll('.zoom-layer svg rect, .zoom-layer svg path, .zoom-layer svg polygon'))
        .filter(shape => !shape.closest('.map-room'));
      if (shapes.length === 0) return;

      let maxArea = 0;
      shapes.forEach(s => {
        try { const box = s.getBBox(); const area = box.width * box.height; if (area > maxArea) maxArea = area; } catch(e) {}
      });

      shapes.forEach((shape) => {
        const computedStyle = window.getComputedStyle(shape);
        const stroke = computedStyle.stroke;
        let isBlackStroke = false;
        if (stroke && stroke !== 'none') {
          const rgb = stroke.match(/\d+/g);
          if (rgb) {
            const [r, g, b] = rgb.map(Number);
            if (r < 50 && g < 50 && b < 50) isBlackStroke = true;
          }
        }
        if (!isBlackStroke) return;
        const box = shape.getBBox();
        if (box.width * box.height >= maxArea * 0.8) return;

        const parent = shape.parentNode;
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'map-room');
        let finalId = currentFloorRef.current + (roomIds[index] || (index + 16).toString());
        group.setAttribute('data-room', finalId);
        group.style.cursor = 'pointer';

        parent.insertBefore(group, shape);
        group.appendChild(shape);
        shape.removeAttribute('style');
        shape.removeAttribute('fill');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'room-label');
        text.setAttribute('x', box.x + box.width / 2);
        text.setAttribute('y', box.y + box.height / 2);
        text.setAttribute('style', 'pointer-events: none; dominant-baseline: middle; text-anchor: middle;');
        text.textContent = finalId;
        group.appendChild(text);
        index++;
      });
      // После создания всех элементов — раскрашиваем
      updateMapColors();
    }, 50);
  }, [svgContent, currentFloor, updateMapColors]);

  // При изменении roomsData или svgContent (этаж) — перекрашиваем, если SVG уже есть
  useEffect(() => {
    if (svgContent && roomsData.length > 0) {
      // Небольшая задержка, чтобы prepareSVG успел отработать
      const timer = setTimeout(() => updateMapColors(), 100);
      return () => clearTimeout(timer);
    }
  }, [roomsData, svgContent, updateMapColors]);

  useEffect(() => { loadFloor(1); }, [loadFloor]);
useEffect(() => {
  if (svgContent) {
    prepareSVG();
  }
});
  // Центрирование при initialRoomId
  useEffect(() => {
    if (initialRoomId) {
      const timer = setTimeout(() => goToRoom(initialRoomId), 300);
      return () => clearTimeout(timer);
    }
  }, [initialRoomId]);

  // ===== Смена этажа =====
  const changeFloor = (floor) => {
    if (currentFloorRef.current === floor) return;
    currentFloorRef.current = floor;
    setCurrentFloor(floor);
    setSelectedRoomId(null);
    setPopupRoom(null);
    setScale(1);
    setPointX(0);
    setPointY(0);
    loadFloor(floor);
  };

  // ===== Обработчики мыши =====
  const handleWheel = (e) => {
    e.preventDefault();
    const rect = mapAreaRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xs = (mouseX - pointX) / scale;
    const ys = (mouseY - pointY) / scale;
    let newScale = e.deltaY < 0 ? scale * 1.15 : scale / 1.15;
    newScale = Math.max(0.2, Math.min(newScale, 5));
    setScale(newScale);
    setPointX(mouseX - xs * newScale);
    setPointY(mouseY - ys * newScale);
  };

  const handleMapClick = (e) => {
    const roomGroup = e.target.closest('.map-room');
    if (roomGroup) {
      e.stopPropagation();
      const id = roomGroup.getAttribute('data-room');
      setSelectedRoomId(id);
      // Создаём объект комнаты, даже если его нет в roomsData (пустая комната)
      let room = roomsDataRef.current.find(r => r.id === id);
      if (!room) {
        room = { id, capacity: 2, students: [] };
      }
      setPopupRoom(room);
      setShowGlobalDropdown(false);
      setShowGlobalFilterDropdown(false);
      // Перекрашиваем сразу
      setTimeout(() => updateMapColors(), 0);
    } else {
      setPopupRoom(null);
      setSelectedRoomId(null);
     // setTimeout(() => updateMapColors(), 0);
    }
  };

  const handleMouseDown = (e) => {
    if (e.button === 0 && !e.target.closest('.map-room')) {
      setPanning(true);
      setStartPan({ x: e.clientX - pointX, y: e.clientY - pointY });
    }
  };

  useEffect(() => {
    const mu = () => setPanning(false);
    const mm = (e) => { if (panning) { setPointX(e.clientX - startPan.x); setPointY(e.clientY - startPan.y); } };
    window.addEventListener('mouseup', mu); window.addEventListener('mousemove', mm);
    return () => { window.removeEventListener('mouseup', mu); window.removeEventListener('mousemove', mm); };
  }, [panning, startPan]);

  // ===== Переход к комнате =====
  const goToRoom = (roomId) => {
    setShowGlobalDropdown(false);
    setShowGlobalFilterDropdown(false);
    const targetFloor = parseInt(roomId.charAt(0));
    const centerIt = () => {
      const attemptFocus = (retries = 0) => {
        const el = document.querySelector(`[data-room="${roomId}"]`);
        if (!el) {
          if (retries < 15) setTimeout(() => attemptFocus(retries + 1), 100);
          return;
        }
        const rect = el.getBBox();
        const area = mapAreaRef.current;
        const nScale = 2.0;
        setScale(nScale);
        setPointX((area.clientWidth / 2) - (rect.x + rect.width / 2) * nScale);
        setPointY((area.clientHeight / 2) - (rect.y + rect.height / 2) * nScale);
        setSelectedRoomId(roomId);
        let room = roomsDataRef.current.find(r => r.id === roomId);
        if (!room) room = { id: roomId, capacity: 2, students: [] };
        setPopupRoom(room);
        //setTimeout(() => updateMapColors(), 50);
      };
      attemptFocus();
    };

    if (targetFloor !== currentFloorRef.current) {
      changeFloor(targetFloor);
      setTimeout(centerIt, 500);
    } else {
      setTimeout(centerIt, 50);
    }
  };

  // ===== Глобальный поиск =====
  const executeGlobalSearch = useCallback(() => {
    const q = globalSearchRef.current?.value.toLowerCase().trim() || '';
    if (!q && activeGlobalFaculties.length === 0) {
      setGlobalSearchResults([]);
      setShowGlobalDropdown(false);
      return;
    }
    const res = globalStudentsDB.filter(s => {
      const mQ = q ? (s.name.toLowerCase().includes(q) || s.room.includes(q)) : true;
      const mF = activeGlobalFaculties.length > 0 ? activeGlobalFaculties.includes(s.fac) : true;
      return mQ && mF;
    });
    setGlobalSearchResults(res);
    setShowGlobalDropdown(true);
  }, [globalStudentsDB, activeGlobalFaculties]);

  useEffect(() => {
    executeGlobalSearch();
  }, [activeGlobalFaculties, globalStudentsDB, executeGlobalSearch]);

  // ===== Закрытие поиска и фильтров при клике вне =====
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (globalSearchContainerRef.current && !globalSearchContainerRef.current.contains(e.target)) {
        setShowGlobalDropdown(false);
      }
      if (filterContainerRef.current && !filterContainerRef.current.contains(e.target)) {
        setShowGlobalFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ===== Локальный поиск (левая панель) =====
  const localSearch = () => {
    const q = localSearchQuery.toLowerCase().trim();
    const f = localFacultyFilter;
    if (!q && f === 'all') return <p className="empty-msg">Введите запрос для поиска</p>;
    const cards = [];
    roomsData.forEach(r => {
      const matched = r.students.filter(s =>
        (q ? (s.name.toLowerCase().includes(q) || r.id.includes(q)) : true) &&
        (f === 'all' || s.fac === f)
      );
      matched.forEach(s => cards.push(
        <div className="student-card" key={s.contract} onClick={() => goToRoom(r.id)}>
          <h4>{s.name}</h4><p><b>Комната:</b> {r.id}</p><p><b>Факультет:</b> {s.fac}</p>
        </div>
      ));
      if (r.students.length === 0 && q && r.id.includes(q) && f === 'all') {
        cards.push(<div className="student-card free" key={r.id} onClick={() => goToRoom(r.id)}><h4>Комната {r.id}</h4><p>Свободна</p></div>);
      }
    });
    return cards.length ? cards : <p className="empty-msg">Ничего не найдено</p>;
  };

  // ===== Рендер =====
  if (loadingData) return <div className="loading-spinner">Загрузка данных общежития...</div>;
  if (dataError) return <div className="error-message">{dataError}</div>;

  return (
    <div className="dorm-map-wrapper" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Основная область */}
      <div className="app-body" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div className={`search-panel ${panelCollapsed ? 'collapsed' : ''}`} style={{ zIndex: 100 }}>
          <button className="panel-toggle-btn" onClick={() => setPanelCollapsed(!panelCollapsed)}>{panelCollapsed ? '▶' : '◀'}</button>
          <button className="back-to-campus" onClick={onBack}>← К общежитиям</button>
          <h3 className="search-panel-title">Поиск по общежитию</h3>
          <div className="search-controls">
            <input type="text" className="local-search-input" placeholder="ФИО, комната..." value={localSearchQuery} onChange={e => setLocalSearchQuery(e.target.value)} />
            <select className="local-filter-select" value={localFacultyFilter} onChange={e => setLocalFacultyFilter(e.target.value)}>
              <option value="all">Все факультеты</option>
              <option value="МехМат">МехМат</option><option value="ФизФак">ФизФак</option><option value="ФИТ">ФИТ</option><option value="Эконом">Эконом</option>
            </select>
          </div>
          <div className="info-list">{localSearch()}</div>
        </div>

        <div className="map-area" ref={mapAreaRef} onWheel={handleWheel} onMouseDown={handleMouseDown} style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#f5f7f9' }}>
          <div
            key={currentFloor}
            className="zoom-layer"
            ref={zoomLayerRef}
            onClick={handleMapClick}
            style={{ transform: `translate(${pointX}px, ${pointY}px) scale(${scale})`, transformOrigin: '0 0', cursor: panning ? 'grabbing' : 'default' }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />

          {popupRoom && (
            <div className="room-popup" style={{ display: 'block', zIndex: 1001 }}>
              <span className="close-popup" onClick={() => { setPopupRoom(null); setSelectedRoomId(null); setTimeout(() => console.log("закрыть попап"), 0); }}>✖</span>
              <h3>Комната {popupRoom.id}</h3>
              <div className="popup-content">
                <b>Мест: {popupRoom.capacity}</b><br /><br />
                {popupRoom.students.map((s, i) => (
                  <div key={i} className="student-entry"><b>{s.name}</b><br />{s.fac} | {s.category}</div>
                ))}
                {popupRoom.students.length === 0 && <p>Комната пуста</p>}
              </div>
            </div>
          )}

          <div className="floor-switcher">
            {[1,2,3].map(f => (
              <button key={f} className={`floor-btn ${currentFloor === f ? 'active' : ''}`} onClick={() => changeFloor(f)}>{f} Этаж</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DormMap;