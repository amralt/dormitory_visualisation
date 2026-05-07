import React, { useState, useEffect, useRef, useCallback } from 'react';
import { filterResidents } from './api';
import './DormMap.css';
import facultyColors from '../config/facultyColors'; // <-- импорт цветов

const normalizeRoomId = (rawRoom) => {
  if (!rawRoom) return "";
  return String(rawRoom).trim().split(' ')[0];
};

const DormMap = ({ dormId, onBack, onGoToDashboard, onLogout, initialRoomId, onDownloadClick, userName }) => {
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

  // Новые состояния для режима отображения
  const [viewMode, setViewMode] = useState('rooms'); // 'rooms' или 'beds'
  const [bedAssignments, setBedAssignments] = useState({}); // { "120_1": student, ... }

  const zoomLayerRef = useRef(null);
  const mapAreaRef = useRef(null);
  const globalSearchRef = useRef(null);
  const globalSearchContainerRef = useRef(null);
  const filterContainerRef = useRef(null);
  const currentFloorRef = useRef(1);
  const roomsDataRef = useRef([]);
  const selectedRoomIdRef = useRef(null);
  const viewModeRef = useRef(viewMode);

  useEffect(() => { roomsDataRef.current = roomsData; }, [roomsData]);
  useEffect(() => { selectedRoomIdRef.current = selectedRoomId; }, [selectedRoomId]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);

  // Загрузка данных о жильцах
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
        residents.forEach((r, index) => {
          const roomId = normalizeRoomId(r.room);
          if (!roomMap[roomId]) {
            roomMap[roomId] = { id: roomId, capacity: 2, students: [] };
          }
          roomMap[roomId].students.push({
            name: r.fiz_lico,
            fac: r.department,
            category: r.resident_category,
            contract: `${roomId}-${r.fiz_lico.split(' ')[0]}-${index}`,
          });
        });
        const roomsArray = Object.values(roomMap);
        // Присваиваем номер кровати каждому студенту
        roomsArray.forEach(room => {
          room.students.forEach((s, i) => {
            s.bed = i + 1;
            s.bedId = `${room.id}_${i + 1}`;
          });
        });
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
              bedId: s.bedId // для быстрого поиска по кровати
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

  // Вычисляем назначения по кроватям
  useEffect(() => {
    const assignments = {};
    roomsData.forEach(room => {
      room.students.forEach(s => {
        assignments[s.bedId] = s;
      });
    });
    setBedAssignments(assignments);
  }, [roomsData]);

  // Загрузка SVG в зависимости от режима
  const loadFloor = useCallback(async (floor) => {
    const svgPath = viewModeRef.current === 'beds'
      ? `/bedmap_${floor}.svg`
      : `/map_${floor}.svg`;
    try {
      const response = await fetch(svgPath);
      if (!response.ok) throw new Error('SVG not found');
      const svgText = await response.text();
      setSvgContent(svgText);
    } catch (error) {
      setSvgContent(`<div style="text-align:center; padding: 20px;"><h3>Ошибка загрузки ${svgPath}</h3></div>`);
    }
  }, []);

  const normalizeRoomId = (rawRoom) => {
    if (!rawRoom) return "";
    // Берём первую часть до пробела, а затем отсекаем суффикс /...
    return String(rawRoom).trim().split(' ')[0].split('/')[0];
  };

  // Цвета для комнат (существующая логика)
  const updateMapColors = useCallback(() => {
  document.querySelectorAll('.map-room').forEach(roomEl => {
    const mapRoomId = roomEl.getAttribute('data-room');
    const room = roomsDataRef.current.find(r => r.id === mapRoomId);
    roomEl.classList.remove('status-free', 'status-partial', 'status-full', 'status-selected');
    if (selectedRoomIdRef.current === mapRoomId) {
      roomEl.classList.add('status-selected');
      return;
    }
    if (!room) return;
    const occupied = room.students.length;
    if (occupied === 0) roomEl.classList.add('status-free');
    else if (occupied < room.capacity) roomEl.classList.add('status-partial');
    else roomEl.classList.add('status-full');
  });
}, []);

  const prepareSVG = useCallback(() => {
  if (!svgContent || !svgContent.includes('<svg')) return;
  setTimeout(() => {
    const roomIdsFallback = ["01","02","03","04","05","06","07","08","09","10","11","12","13","14","15"];
    let fallbackIndex = 0;

    const shapes = Array.from(
      document.querySelectorAll('.zoom-layer svg rect, .zoom-layer svg path, .zoom-layer svg polygon')
    ).filter(shape => !shape.closest('.map-room'));

    if (shapes.length === 0) return;

    // Вычисляем максимальную площадь для исключения внешних контуров
    let maxArea = 0;
    shapes.forEach(s => {
      try {
        const box = s.getBBox();
        const area = box.width * box.height;
        if (area > maxArea) maxArea = area;
      } catch(e) {}
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

      try {
        const box = shape.getBBox();
        if (box.width * box.height >= maxArea * 0.8) return;
      } catch(e) { return; }

      // --- Извлечение настоящего ID комнаты ---
      let roomId = null;

      // 1. data-room самого элемента (если есть)
      const dataRoom = shape.getAttribute('data-room');
      if (dataRoom && /^\d+/.test(dataRoom)) {
        roomId = dataRoom.trim();
      }
      // 2. id элемента вида "102/1", "205" и т.п.
      else {
        const shapeId = shape.getAttribute('id');
        if (shapeId && /^\d+/.test(shapeId)) {
          const match = shapeId.match(/^(\d+)(?:\/|$)/);
          if (match) roomId = match[1]; // "102/1" → "102"
        }
      }

      // 3. Если нет ни того ни другого — ищем в родительских <g>
      if (!roomId) {
        let parent = shape.parentNode;
        while (parent && parent !== zoomLayerRef.current) {
          if (parent.tagName === 'g' || parent.tagName === 'G') {
            const parentId = parent.getAttribute('data-room') || parent.getAttribute('id');
            if (parentId && /^\d+/.test(parentId)) {
              const match = parentId.match(/^(\d+)(?:\/|$)/);
              if (match) {
                roomId = match[1];
                break;
              }
            }
          }
          parent = parent.parentNode;
        }
      }

      // 4. Если всё равно не нашли – fallback на старую индексацию
      let finalId;
      if (roomId) {
        finalId = roomId;               // например, "102"
      } else {
        finalId = currentFloorRef.current + (roomIdsFallback[fallbackIndex] || (fallbackIndex + 16).toString());
        fallbackIndex++;
      }

      // Создаём группу
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'map-room');
      group.setAttribute('data-room', finalId);
      group.style.cursor = 'pointer';

      const parentElement = shape.parentNode;
      parentElement.insertBefore(group, shape);
      group.appendChild(shape);
      shape.removeAttribute('style');
      shape.removeAttribute('fill');

      const box = shape.getBBox();
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('class', 'room-label');
      text.setAttribute('x', box.x + box.width / 2);
      text.setAttribute('y', box.y + box.height / 2);
      text.setAttribute('style', 'pointer-events: none; dominant-baseline: middle; text-anchor: middle;');
      text.textContent = finalId;
      group.appendChild(text);
    });

    updateMapColors();
  }, 50);
}, [svgContent, updateMapColors]);



  // Подготовка SVG для режима кроватей
  const prepareBedSVG = useCallback(() => {
    if (!svgContent || !svgContent.includes('<svg')) return;
    setTimeout(() => {
      const beds = document.querySelectorAll('.zoom-layer svg rect[id], .zoom-layer svg path[id], .zoom-layer svg polygon[id]');
      beds.forEach(bed => {
        bed.classList.add('bed');
        bed.setAttribute('data-bed-id', bed.id);
        bed.style.cursor = 'pointer';
      });
      updateBedColors();
    }, 50);
  }, [svgContent]);

  // Раскраска кроватей по факультетам
  const updateBedColors = useCallback(() => {
    const beds = document.querySelectorAll('.zoom-layer .bed');
    beds.forEach(bed => {
      const bedId = bed.getAttribute('data-bed-id') || bed.id;
      const student = bedAssignments[bedId];
      if (student) {
        const color = facultyColors[student.fac] || facultyColors.default;
        bed.style.fill = color;
        bed.style.stroke = '#37474f';
        bed.style.strokeWidth = '2px';
        bed.classList.add('bed-occupied');
        bed.classList.remove('bed-empty');
      } else {
        bed.style.fill = '#f5f5f5';
        bed.style.stroke = '#b0bec5';
        bed.style.strokeWidth = '1px';
        bed.classList.add('bed-empty');
        bed.classList.remove('bed-occupied');
      }
    });
  }, [bedAssignments, facultyColors]);

  // Первоначальная загрузка этажа
  useEffect(() => { loadFloor(1); }, [loadFloor]);

  // Вставка SVG в DOM и подготовка
  useEffect(() => {
    if (!loadingData && svgContent && zoomLayerRef.current) {
      zoomLayerRef.current.innerHTML = svgContent;
      if (viewMode === 'rooms') {
        prepareSVG();
      } else if (viewMode === 'beds') {
        prepareBedSVG();
      }
    }
  }, [svgContent, prepareSVG, prepareBedSVG, loadingData, viewMode]);

  // Переключение этажа
  const changeFloor = (floor) => {
    if (currentFloorRef.current === floor) return;
    currentFloorRef.current = floor;
    setCurrentFloor(floor);
    setSvgContent('');
    setSelectedRoomId(null);
    setPopupRoom(null);
    setScale(1);
    setPointX(0);
    setPointY(0);
    loadFloor(floor);
  };

  // Перезагрузка SVG при смене режима
  useEffect(() => {
    if (viewMode) {
      setSvgContent('');
      loadFloor(currentFloorRef.current);
    }
  }, [viewMode, loadFloor]);

  // Обработка колеса мыши (зум)
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const rect = mapAreaRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xs = (mouseX - pointX) / scale;
    const ys = (mouseY - pointY) / scale;
    let newScale = e.deltaY < 0 ? scale * 1.15 : scale / 1.15;
    newScale = Math.max(0.2, Math.min(newScale, 5));
    setScale(prevScale => {
      const nextScale = newScale;
      setPointX(mouseX - xs * nextScale);
      setPointY(mouseY - ys * nextScale);
      return nextScale;
    });
  }, [pointX, pointY, scale]);

  useEffect(() => {
    const mapArea = mapAreaRef.current;
    if (mapArea) mapArea.addEventListener('wheel', handleWheel, { passive: false });
    return () => { if (mapArea) mapArea.removeEventListener('wheel', handleWheel); };
  }, [handleWheel]);

  // Обработка клика по карте (комнаты / кровати)
  const handleMapClick = (e) => {
    if (viewModeRef.current === 'beds') {
      const bedEl = e.target.closest('.bed');
      if (bedEl) {
        e.stopPropagation();
        const bedId = bedEl.getAttribute('data-bed-id') || bedEl.id;
        const student = bedAssignments[bedId];
        setSelectedRoomId(bedId);
        setPopupRoom({
          id: `Кровать ${bedId}`,
          capacity: 1,
          students: student ? [student] : []
        });
        setShowGlobalDropdown(false);
        setShowGlobalFilterDropdown(false);
        return;
      } else {
        setPopupRoom(null);
        setSelectedRoomId(null);
        return;
      }
    }

    // Режим комнат
    const roomGroup = e.target.closest('.map-room');
    if (roomGroup) {
      e.stopPropagation();
      const mapRoomId = roomGroup.getAttribute('data-room');
      setSelectedRoomId(mapRoomId);
      const matchingRooms = roomsDataRef.current.filter(r =>
        r.id === mapRoomId || r.id.startsWith(mapRoomId + '/')
      );
      if (matchingRooms.length > 0) {
        const allStudents = matchingRooms.reduce((acc, r) => acc.concat(r.students), []);
        const totalCapacity = matchingRooms.reduce((acc, r) => acc + r.capacity, 0);
        const displayTitle = matchingRooms.length > 1 ? `Блок ${mapRoomId}` : matchingRooms[0].id;
        setPopupRoom({ id: displayTitle, capacity: totalCapacity, students: allStudents });
      } else {
        setPopupRoom({ id: mapRoomId, capacity: 2, students: [] });
      }
      setShowGlobalDropdown(false);
      setShowGlobalFilterDropdown(false);
    } else {
      setPopupRoom(null);
      setSelectedRoomId(null);
    }
  };

  const handleMouseDown = (e) => {
    if (e.button === 0 && !e.target.closest('.map-room') && !e.target.closest('.bed')) {
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

  // Переход к комнате/кровати
  const goToRoom = (rawId) => {
    setShowGlobalDropdown(false);
    setShowGlobalFilterDropdown(false);

    if (viewModeRef.current === 'beds') {
      // rawId – bedId (например, "120_1")
      const roomNumber = rawId.split('_')[0];
      const targetFloor = parseInt(roomNumber.charAt(0));
      const centerBed = () => {
        const attempt = (retries = 0) => {
          const el = document.querySelector(`[data-bed-id="${rawId}"]`) || document.getElementById(rawId);
          if (!el) { if (retries < 30) setTimeout(() => attempt(retries + 1), 100); return; }
          const area = mapAreaRef.current;
          const layer = zoomLayerRef.current;
          if (!area || !layer) { if (retries < 30) setTimeout(() => attempt(retries + 1), 100); return; }
          const elRect = el.getBoundingClientRect();
          const layerRect = layer.getBoundingClientRect();
          if (elRect.width === 0 || elRect.height === 0) {
            if (retries < 30) setTimeout(() => attempt(retries + 1), 100);
            return;
          }
          const currentScaledDx = (elRect.left - layerRect.left) + elRect.width / 2;
          const currentScaledDy = (elRect.top - layerRect.top) + elRect.height / 2;
          const unscaledDx = currentScaledDx / scale;
          const unscaledDy = currentScaledDy / scale;
          const nScale = 2.0;
          const targetX = (area.clientWidth / 2) - unscaledDx * nScale;
          const targetY = (area.clientHeight / 2) - unscaledDy * nScale;
          setScale(nScale);
          setPointX(targetX);
          setPointY(targetY);
          setSelectedRoomId(rawId);
          const student = bedAssignments[rawId];
          setPopupRoom({ id: `Кровать ${rawId}`, capacity: 1, students: student ? [student] : [] });
        };
        attempt();
      };
      if (targetFloor !== currentFloorRef.current) {
        changeFloor(targetFloor);
        setTimeout(centerBed, 600);
      } else {
        setTimeout(centerBed, 100);
      }
      return;
    }

    // Режим комнат (существующая логика)
    const roomId = viewMode === 'rooms' ? normalizeRoomId(rawId) : rawId;
    const targetFloor = parseInt(roomId.charAt(0));
    const centerRoom = () => {
      const attempt = (retries = 0) => {
        let el = document.querySelector(`[data-room="${roomId}"]`);
        if (!el && roomId.includes('/')) {
          el = document.querySelector(`[data-room="${roomId.split('/')[0]}"]`);
        }
        if (!el) { if (retries < 30) setTimeout(() => attempt(retries + 1), 100); return; }
        const area = mapAreaRef.current;
        const layer = zoomLayerRef.current;
        if (!area || !layer) { if (retries < 30) setTimeout(() => attempt(retries + 1), 100); return; }
        const elRect = el.getBoundingClientRect();
        const layerRect = layer.getBoundingClientRect();
        if (elRect.width === 0 || elRect.height === 0) {
          if (retries < 30) setTimeout(() => attempt(retries + 1), 100);
          return;
        }
        const currentScaledDx = (elRect.left - layerRect.left) + elRect.width / 2;
        const currentScaledDy = (elRect.top - layerRect.top) + elRect.height / 2;
        const unscaledDx = currentScaledDx / scale;
        const unscaledDy = currentScaledDy / scale;
        const nScale = 2.0;
        const targetX = (area.clientWidth / 2) - unscaledDx * nScale;
        const targetY = (area.clientHeight / 2) - unscaledDy * nScale;
        setScale(nScale);
        setPointX(targetX);
        setPointY(targetY);
        setSelectedRoomId(roomId);
        let room = roomsDataRef.current.find(r => r.id === roomId);
        if (!room) room = { id: roomId, capacity: 2, students: [] };
        setPopupRoom(room);
      };
      attempt();
    };
    if (targetFloor !== currentFloorRef.current) {
      changeFloor(targetFloor);
      setTimeout(centerRoom, 600);
    } else {
      setTimeout(centerRoom, 100);
    }
  };

  // Поиск (глобальный и локальный) – оставлен без изменений, кроме карточек студентов
  const executeGlobalSearch = useCallback(() => {
    const q = globalSearchRef.current?.value.toLowerCase().trim() || '';
    if (!q && activeGlobalFaculties.length === 0) { setGlobalSearchResults([]); setShowGlobalDropdown(false); return; }
    const res = globalStudentsDB.filter(s => {
      const mQ = q ? (s.name.toLowerCase().includes(q) || s.room.includes(q)) : true;
      const mF = activeGlobalFaculties.length > 0 ? activeGlobalFaculties.includes(s.fac) : true;
      return mQ && mF;
    });
    setGlobalSearchResults(res);
    setShowGlobalDropdown(true);
  }, [globalStudentsDB, activeGlobalFaculties]);

  useEffect(() => { executeGlobalSearch(); }, [activeGlobalFaculties, globalStudentsDB, executeGlobalSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (globalSearchContainerRef.current && !globalSearchContainerRef.current.contains(e.target)) setShowGlobalDropdown(false);
      if (filterContainerRef.current && !filterContainerRef.current.contains(e.target)) setShowGlobalFilterDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const localSearch = () => {
    const onClickAction = viewMode === 'beds' 
        ? () => goToRoom(s.bedId) 
        : () => goToRoom(r.id);  
    const q = localSearchQuery.toLowerCase().trim();
    const f = localFacultyFilter;
    if (!q && f === 'all') return <p className="empty-msg">Введите запрос для поиска</p>;
    const cards = [];
    roomsData.forEach(r => {
      r.students.forEach((s, idx) => {
        if ((q && (s.name.toLowerCase().includes(q) || r.id.includes(q))) && (f === 'all' || s.fac === f)) {
          cards.push(
            <div className="student-card" key={s.contract} onClick={() => goToRoom(s.bedId)}>
              <h4>{s.name}</h4>
              <p><b>Комната:</b> {r.id} (кровать {s.bed})</p>
              <p><b>Факультет:</b> {s.fac}</p>
            </div>
          );
        }
      });
      if (r.students.length === 0 && q && r.id.includes(q) && f === 'all') {
        cards.push(
          <div className="student-card free" key={`free-${r.id}`} onClick={() => goToRoom(r.id)}>
            <h4>Комната {r.id}</h4><p>Свободна</p>
          </div>
        );
      }
    });
    return cards.length ? cards : <p className="empty-msg">Ничего не найдено</p>;
  };

  if (loadingData) return <div className="loading-spinner">Загрузка данных...</div>;
  if (dataError) return <div className="error-message">{dataError}</div>;

  return (
    <div className="dorm-map-wrapper" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
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

        <div
          className="map-area"
          ref={mapAreaRef}
          onMouseDown={handleMouseDown}
          style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#f5f7f9' }}
        >
          <div
            className="zoom-layer"
            ref={zoomLayerRef}
            onClick={handleMapClick}
            style={{
              transform: `translate(${pointX}px, ${pointY}px) scale(${scale})`,
              transformOrigin: '0 0',
              cursor: panning ? 'grabbing' : 'default'
            }}
          />

          {popupRoom && (
            <div className="room-popup" style={{ display: 'block', zIndex: 1001 }}>
              <span className="close-popup" onClick={() => { setPopupRoom(null); setSelectedRoomId(null); }}>✖</span>
              <h3>{popupRoom.id}</h3>
              <div className="popup-content">
                <b>Мест: {popupRoom.capacity}</b><br /><br />
                {popupRoom.students.map((s, i) => (
                  <div key={i} className="student-entry"><b>{s.name}</b><br />{s.fac} | {s.category}</div>
                ))}
                {popupRoom.students.length === 0 && <p>{viewMode === 'beds' ? 'Кровать свободна' : 'Комната пуста'}</p>}
              </div>
            </div>
          )}

          {/* Переключатель этажей */}
          <div className="floor-switcher">
            {[1,2,3].map(f => (
              <button key={f} className={`floor-btn ${currentFloor === f ? 'active' : ''}`} onClick={() => changeFloor(f)}>{f} Этаж</button>
            ))}
          </div>

          {/* Блок выбора режима и легенда */}
          <div className="view-mode-legend">
            <div className="view-mode-switcher">
              <button
                className={`mode-btn ${viewMode === 'rooms' ? 'active' : ''}`}
                onClick={() => setViewMode('rooms')}
              >
                По комнатам
              </button>
              <button
                className={`mode-btn ${viewMode === 'beds' ? 'active' : ''}`}
                onClick={() => setViewMode('beds')}
              >
                По кроватям
              </button>
            </div>
            <div className="legend">
              <h4>Легенда факультетов</h4>
              {Object.entries(facultyColors).map(([fac, color]) => {
                if (fac === 'default') return null;
                return (
                  <div key={fac} className="legend-item">
                    <span className="color-box" style={{ backgroundColor: color }}></span>
                    <span className="legend-label">{fac}</span>
                  </div>
                );
              })}
              <div className="legend-item">
                <span className="color-box" style={{ backgroundColor: '#f5f5f5', border: '1px solid #b0bec5' }}></span>
                <span className="legend-label">Свободно</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DormMap;