import React, { useState, useEffect, useRef, useCallback } from 'react';
import { filterResidents, searchStudents } from './api';
import './DormMap.css';

const DormMap = ({ dormId, onBack, onGoToDashboard, onLogout, initialRoomId, onDownloadClick }) => {
  const [currentFloor, setCurrentFloor] = useState(1);
  const [scale, setScale] = useState(1);
  const [pointX, setPointX] = useState(0);
  const [pointY, setPointY] = useState(0);
  const [panning, setPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [roomsData, setRoomsData] = useState({}); // key: roomId, value: {students, capacity?}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [showGlobalDropdown, setShowGlobalDropdown] = useState(false);
  const [activeGlobalFaculties, setActiveGlobalFaculties] = useState([]);
  const [showGlobalFilterDropdown, setShowGlobalFilterDropdown] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [localFacultyFilter, setLocalFacultyFilter] = useState('all');
  const [svgContent, setSvgContent] = useState('');
  const [popupRoom, setPopupRoom] = useState(null);

  const zoomLayerRef = useRef(null);
  const mapAreaRef = useRef(null);
  const globalSearchRef = useRef(null);
  const currentFloorRef = useRef(1);

  // Загрузка студентов для текущего этажа
  const loadFloorData = useCallback(async (floor) => {
    setLoading(true);
    setError(null);
    try {
      const residents = await filterResidents({ dormitory: dormId, floor: floor.toString() });
      // Группировка по комнатам
      const roomsMap = new Map();
      residents.forEach(res => {
        const roomId = res.room;
        if (!roomId) return;
        if (!roomsMap.has(roomId)) {
          roomsMap.set(roomId, { students: [] });
        }
        roomsMap.get(roomId).students.push(res);
      });
      const roomsObj = {};
      roomsMap.forEach((value, key) => {
        roomsObj[key] = { students: value.students, capacity: 2 }; // условно 2 места
      });
      setRoomsData(roomsObj);
    } catch (err) {
      console.error(err);
      setError('Ошибка загрузки данных этажа');
    } finally {
      setLoading(false);
    }
  }, [dormId]);

  const loadFloor = useCallback(async (floor) => {
    try {
      const response = await fetch(`/map_${floor}.svg`);
      if (!response.ok) throw new Error('SVG not found');
      const svgText = await response.text();
      setSvgContent(svgText);
      await loadFloorData(floor);
    } catch (error) {
      setSvgContent(`<div style="text-align:center; padding: 20px;"><h3>Ошибка загрузки map_${floor}.svg</h3></div>`);
    }
  }, [loadFloorData]);

  useEffect(() => {
    loadFloor(currentFloor);
    currentFloorRef.current = currentFloor;
  }, [currentFloor, loadFloor]);

  const prepareSVG = useCallback(() => {
    if (!svgContent || !svgContent.includes('<svg')) return;
    setTimeout(() => {
      const roomIds = Object.keys(roomsData);
      const shapes = Array.from(document.querySelectorAll('.zoom-layer svg rect, .zoom-layer svg path, .zoom-layer svg polygon'))
                          .filter(shape => !shape.closest('.map-room'));
      if (shapes.length === 0) return;

      let maxArea = 0;
      shapes.forEach(s => {
        try { const box = s.getBBox(); const area = box.width * box.height; if (area > maxArea) maxArea = area; } catch(e) {}
      });

      shapes.forEach((shape, idx) => {
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
        let finalId = roomIds[idx] || `${currentFloorRef.current}${idx+1}`;
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
      });
      updateMapColors();
    }, 50);
  }, [svgContent, roomsData]);

  const updateMapColors = useCallback(() => {
    document.querySelectorAll('.map-room').forEach(roomEl => {
      const roomId = roomEl.getAttribute('data-room');
      const roomData = roomsData[roomId];
      roomEl.classList.remove('status-free', 'status-partial', 'status-full', 'status-selected');
      if (roomData) {
        const occupied = roomData.students.length;
        const capacity = roomData.capacity || 2;
        if (selectedRoomId === roomId) roomEl.classList.add('status-selected');
        else if (occupied === 0) roomEl.classList.add('status-free');
        else if (occupied < capacity) roomEl.classList.add('status-partial');
        else roomEl.classList.add('status-full');
      }
    });
  }, [roomsData, selectedRoomId]);

  useEffect(() => { updateMapColors(); }, [roomsData, selectedRoomId, updateMapColors]);
  useEffect(() => { prepareSVG(); }, [svgContent, currentFloor, roomsData, prepareSVG]);

  // Переход к комнате по ID
  const goToRoom = useCallback((roomId) => {
    setShowGlobalDropdown(false);
    setPopupRoom(null);
    setSelectedRoomId(null);
    const targetFloor = parseInt(roomId.charAt(0), 10);
    const centerIt = () => {
      setTimeout(() => {
        const el = document.querySelector(`[data-room="${roomId}"]`);
        if (!el) return;
        const rect = el.getBBox();
        const area = mapAreaRef.current;
        const nScale = 2.0;
        setScale(nScale);
        setPointX((area.clientWidth / 2) - (rect.x + rect.width / 2) * nScale);
        setPointY((area.clientHeight / 2) - (rect.y + rect.height / 2) * nScale);
        setSelectedRoomId(roomId);
        setPopupRoom({ id: roomId, students: roomsData[roomId]?.students || [], capacity: roomsData[roomId]?.capacity || 2 });
      }, 50);
    };
    if (targetFloor !== currentFloorRef.current) {
      setCurrentFloor(targetFloor);
      setTimeout(centerIt, 500);
    } else {
      centerIt();
    }
  }, [roomsData]);

  useEffect(() => {
    if (initialRoomId) {
      const timer = setTimeout(() => goToRoom(initialRoomId), 300);
      return () => clearTimeout(timer);
    }
  }, [initialRoomId, goToRoom]);

  // Вспомогательные функции панорамирования/масштабирования (без изменений)
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
      setPopupRoom({ id, students: roomsData[id]?.students || [], capacity: roomsData[id]?.capacity || 2 });
      setShowGlobalDropdown(false);
    } else {
      setPopupRoom(null);
      setSelectedRoomId(null);
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

  // Глобальный поиск
  const executeGlobalSearch = async () => {
    const q = globalSearchRef.current?.value.toLowerCase().trim() || '';
    if (!q && activeGlobalFaculties.length === 0) { 
      setGlobalSearchResults([]); 
      setShowGlobalDropdown(false); 
      return; 
    }
    try {
      const results = await searchStudents(q);
      let filtered = results;
      if (activeGlobalFaculties.length > 0) {
        filtered = results.filter(s => activeGlobalFaculties.includes(s.department));
      }
      setGlobalSearchResults(filtered);
      setShowGlobalDropdown(true);
    } catch (err) {
      console.error(err);
      setGlobalSearchResults([]);
    }
  };

  useEffect(() => { executeGlobalSearch(); }, [activeGlobalFaculties]);

  // Локальный поиск по текущему этажу
  const localSearch = () => {
    const q = localSearchQuery.toLowerCase().trim();
    const f = localFacultyFilter;
    if (!q && f === 'all') return <p className="empty-msg">Введите запрос для поиска</p>;
    const cards = [];
    Object.entries(roomsData).forEach(([roomId, room]) => {
      const matched = room.students.filter(s => 
        (q ? (s.fiz_lico?.toLowerCase().includes(q) || s.organisation?.toLowerCase().includes(q)) : true) &&
        (f === 'all' || s.department === f)
      );
      matched.forEach(s => cards.push(
        <div className="student-card" key={s.fiz_lico} onClick={() => goToRoom(roomId)}>
          <h4>{s.fiz_lico}</h4><p><b>Комната:</b> {roomId}</p><p><b>Факультет:</b> {s.department}</p>
        </div>
      ));
      if (room.students.length === 0 && q && roomId.includes(q) && f === 'all') {
        cards.push(<div className="student-card free" key={roomId} onClick={() => goToRoom(roomId)}><h4>Комната {roomId}</h4><p>Свободна</p></div>);
      }
    });
    return cards.length ? cards : <p className="empty-msg">Ничего не найдено</p>;
  };

  if (loading && !svgContent) return <div className="loading-spinner">Загрузка карты...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="dorm-map-wrapper" style={{height:'100vh', display:'flex', flexDirection:'column'}}>
      <header className="top-navbar" style={{zIndex: 1000}}>
        <div className="nav-left" onClick={onBack} style={{cursor:'pointer'}}>
          <div className="n-star-logo"><span className="n-char">N</span><span className="star-char">*</span></div>
          <span>СтудГородок</span>
        </div>
        <div className="search-container">
          <div className="search-row">
            <div className="search-input-wrapper">
              <input ref={globalSearchRef} type="text" className="header-search-input" placeholder="Глобальный поиск..." onChange={executeGlobalSearch} />
              {showGlobalDropdown && (
                <div className="search-results-dropdown" style={{display:'block'}}>
                  {globalSearchResults.length ? globalSearchResults.map((s,i)=>(
                    <div key={i} className="search-result-item" onClick={()=>goToRoom(s.room)}>
                      <div className="res-name">{s.fiz_lico}</div>
                      <div className="res-details">Общ.{s.dormitory} | Комн.{s.room} | {s.department}</div>
                    </div>
                  )) : <div className="no-res">Нет результатов</div>}
                </div>
              )}
            </div>
            <div className="header-filter-wrapper">
              <button className="filter-btn" onClick={()=>setShowGlobalFilterDropdown(!showGlobalFilterDropdown)}>Фильтры</button>
              {showGlobalFilterDropdown && (
                <div className="header-filter-dropdown show">
                  {['МехМат','ФизФак','ФИТ','Эконом'].map(fac=>(
                    <label key={fac}><input type="checkbox" checked={activeGlobalFaculties.includes(fac)} 
                    onChange={()=>setActiveGlobalFaculties(p => p.includes(fac)?p.filter(x=>x!==fac):[...p, fac])}/> {fac}</label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="nav-right">
          <button className="stat-btn" onClick={onDownloadClick}>СКАЧАТЬ ТАБЛИЦУ</button>
          <button className="stat-btn" onClick={onGoToDashboard}>СТАТИСТИКА</button>
          <div className="user-profile"><div className="user-avatar">ПН</div><span className="user-name">Пушкарев Николай</span></div>
          <button className="logout-btn-icon" onClick={onLogout}>Выход</button>
        </div>
      </header>

      <div className="app-body" style={{flex:1, display:'flex', overflow:'hidden'}}>
        <div className={`search-panel ${panelCollapsed ? 'collapsed' : ''}`} style={{zIndex: 100}}>
          <button className="panel-toggle-btn" onClick={()=>setPanelCollapsed(!panelCollapsed)}>{panelCollapsed?'▶':'◀'}</button>
          <button className="back-to-campus" onClick={onBack}>← К общежитиям</button>
          <h3 className="search-panel-title">Поиск по общежитию</h3>
          <div className="search-controls">
            <input type="text" className="local-search-input" placeholder="ФИО, комната..." value={localSearchQuery} onChange={e=>setLocalSearchQuery(e.target.value)} />
            <select className="local-filter-select" value={localFacultyFilter} onChange={e=>setLocalFacultyFilter(e.target.value)}>
              <option value="all">Все факультеты</option>
              <option value="МехМат">МехМат</option><option value="ФизФак">ФизФак</option><option value="ФИТ">ФИТ</option><option value="Эконом">Эконом</option>
            </select>
          </div>
          <div className="info-list">{localSearch()}</div>
        </div>

        <div className="map-area" ref={mapAreaRef} onWheel={handleWheel} onMouseDown={handleMouseDown} style={{flex:1, position:'relative', overflow:'hidden', backgroundColor:'#f5f7f9'}}>
          <div 
            key={currentFloor}
            className="zoom-layer" 
            ref={zoomLayerRef}
            onClick={handleMapClick}
            style={{ transform: `translate(${pointX}px, ${pointY}px) scale(${scale})`, transformOrigin: '0 0', cursor: panning?'grabbing':'default' }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
          {popupRoom && (
            <div className="room-popup" style={{display:'block', zIndex: 1001}}>
              <span className="close-popup" onClick={()=>setPopupRoom(null)}>✖</span>
              <h3>Комната {popupRoom.id}</h3>
              <div className="popup-content">
                <b>Мест: {popupRoom.capacity}</b><br/><br/>
                {popupRoom.students.map((s,i)=>(
                  <div key={i} className="student-entry"><b>{s.fiz_lico}</b><br/>{s.department} | {s.organisation}</div>
                ))}
                {popupRoom.students.length===0 && <p>Комната пуста</p>}
              </div>
            </div>
          )}
          <div className="floor-switcher">
            {[1,2,3].map(f=>(
              <button key={f} className={`floor-btn ${currentFloor===f?'active':''}`} onClick={()=>{ setCurrentFloor(f); loadFloor(f); }}>{f} Этаж</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DormMap;