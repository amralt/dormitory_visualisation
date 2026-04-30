import React, { useState, useEffect, useRef, useCallback } from 'react';
import './DormMap.css';

// ======================== БАЗА ДАННЫХ (статика) ========================
const mockData = {
    rooms: [
        // 1 этаж
        { id: "101", capacity: 2, students: [ {name: "Иванов Иван", fac: "МехМат", contract: "101-А", group: "1011"}, {name: "Петров Петр", fac: "МехМат", contract: "101-Б", group: "1011"} ] },
        { id: "102", capacity: 2, students: [ {name: "Сидоров Алексей", fac: "ФИТ", contract: "102-А", group: "1021"}, {name: "Смирнов Дмитрий", fac: "ФИТ", contract: "102-Б", group: "1021"} ] },
        { id: "103", capacity: 3, students: [ {name: "Кузнецов Максим", fac: "Эконом", contract: "103-А", group: "1031"}, {name: "Попов Артем", fac: "Эконом", contract: "103-Б", group: "1031"}, {name: "Соколов Илья", fac: "Эконом", contract: "103-В", group: "1031"} ] },
        { id: "104", capacity: 2, students: [ {name: "Лебедев Даниил", fac: "ФизФак", contract: "104-А", group: "1041"}, {name: "Козлов Никита", fac: "ФизФак", contract: "104-Б", group: "1041"} ] },
        { id: "105", capacity: 2, students: [ {name: "Новиков Егор", fac: "ГГФ", contract: "105-А", group: "1051"}, {name: "Морозов Кирилл", fac: "ГГФ", contract: "105-Б", group: "1051"} ] },
        { id: "106", capacity: 2, students: [ {name: "Волков Матвей", fac: "МехМат", contract: "106-А", group: "1061"} ] },
        { id: "107", capacity: 3, students: [ {name: "Алексеев Тимофей", fac: "ФИТ", contract: "107-А", group: "1071"}, {name: "Лебедев Роман", fac: "ФИТ", contract: "107-Б", group: "1071"} ] },
        { id: "108", capacity: 2, students: [ {name: "Егоров Тимур", fac: "Эконом", contract: "108-А", group: "1081"} ] },
        { id: "109", capacity: 2, students: [ {name: "Павлов Мирон", fac: "ФизФак", contract: "109-А", group: "1091"} ] },
        { id: "110", capacity: 3, students: [ {name: "Ковалев Ярослав", fac: "ГГФ", contract: "110-А", group: "1101"} ] },
        { id: "111", capacity: 2, students: [] },
        { id: "112", capacity: 2, students: [] },
        { id: "113", capacity: 3, students: [] },
        { id: "114", capacity: 2, students: [] },
        { id: "115", capacity: 2, students: [] },
        // 2 этаж
        { id: "201", capacity: 2, students: [] },
        { id: "202", capacity: 2, students: [] },
        { id: "203", capacity: 3, students: [] },
        { id: "204", capacity: 2, students: [] },
        { id: "205", capacity: 2, students: [] },
        { id: "206", capacity: 2, students: [ {name: "Ильин Лев", fac: "МехМат", contract: "206-А", group: "2061"}, {name: "Гусев Марк", fac: "МехМат", contract: "206-Б", group: "2061"} ] },
        { id: "207", capacity: 3, students: [ {name: "Титов Денис", fac: "ФИТ", contract: "207-А", group: "2071"}, {name: "Кузьмин Глеб", fac: "ФИТ", contract: "207-Б", group: "2071"}, {name: "Степанов Илья", fac: "ФИТ", contract: "207-В", group: "2071"} ] },
        { id: "208", capacity: 2, students: [ {name: "Николаев Руслан", fac: "Эконом", contract: "208-А", group: "2081"}, {name: "Орлов Олег", fac: "Эконом", contract: "208-Б", group: "2081"} ] },
        { id: "209", capacity: 2, students: [ {name: "Макаров Антон", fac: "ФизФак", contract: "209-А", group: "2091"}, {name: "Захаров Владислав", fac: "ФизФак", contract: "209-Б", group: "2091"} ] },
        { id: "210", capacity: 3, students: [ {name: "Борисов Давид", fac: "ГГФ", contract: "210-А", group: "2101"}, {name: "Костин Артур", fac: "ГГФ", contract: "210-Б", group: "2101"}, {name: "Романов Степан", fac: "ГГФ", contract: "210-В", group: "2101"} ] },
        { id: "211", capacity: 2, students: [ {name: "Григорьев Макар", fac: "МехМат", contract: "211-А", group: "2111"} ] },
        { id: "212", capacity: 2, students: [ {name: "Дмитриев Евгений", fac: "ФИТ", contract: "212-А", group: "2121"} ] },
        { id: "213", capacity: 3, students: [ {name: "Воронов Игорь", fac: "Эконом", contract: "213-А", group: "2131"}, {name: "Щербаков Леонид", fac: "Эконом", contract: "213-Б", group: "2131"} ] },
        { id: "214", capacity: 2, students: [ {name: "Ширяев Григорий", fac: "ФизФак", contract: "214-А", group: "2141"} ] },
        { id: "215", capacity: 2, students: [ {name: "Мельников Семен", fac: "ГГФ", contract: "215-А", group: "2151"} ] },
        // 3 этаж
        { id: "301", capacity: 2, students: [ {name: "Бобров Федор", fac: "МехМат", contract: "301-А", group: "3011"} ] },
        { id: "302", capacity: 3, students: [ {name: "Жуков Вячеслав", fac: "ФИТ", contract: "302-А", group: "3021"}, {name: "Комаров Альберт", fac: "ФИТ", contract: "302-Б", group: "3021"} ] },
        { id: "303", capacity: 2, students: [ {name: "Белов Анатолий", fac: "Эконом", contract: "303-А", group: "3031"} ] },
        { id: "304", capacity: 2, students: [ {name: "Давыдов Виктор", fac: "ФизФак", contract: "304-А", group: "3041"} ] },
        { id: "305", capacity: 3, students: [ {name: "Сорокин Борис", fac: "ГГФ", contract: "305-А", group: "3051"} ] },
        { id: "311", capacity: 2, students: [ {name: "Медведев Василий", fac: "МехМат", contract: "311-А", group: "3111"}, {name: "Ершов Петр", fac: "МехМат", contract: "311-Б", group: "3111"} ] },
        { id: "312", capacity: 2, students: [ {name: "Крылов Юрий", fac: "ФИТ", contract: "312-А", group: "3121"}, {name: "Цветков Константин", fac: "ФИТ", contract: "312-Б", group: "3121"} ] },
        { id: "313", capacity: 3, students: [ {name: "Михайлов Валерий", fac: "Эконом", contract: "313-А", group: "3131"}, {name: "Савельев Владимир", fac: "Эконом", contract: "313-Б", group: "3131"}, {name: "Рыбаков Станислав", fac: "Эконом", contract: "313-В", group: "3131"} ] },
        { id: "314", capacity: 2, students: [ {name: "Поляков Родион", fac: "ФизФак", contract: "314-А", group: "3141"}, {name: "Маслов Эдуард", fac: "ФизФак", contract: "314-Б", group: "3141"} ] },
        { id: "315", capacity: 2, students: [ {name: "Третьяков Арсений", fac: "ГГФ", contract: "315-А", group: "3151"}, {name: "Федоров Вадим", fac: "ГГФ", contract: "315-Б", group: "3151"} ] }
    ]
};

const globalStudentsDB = [];
mockData.rooms.forEach(room => {
    room.students.forEach(student => {
        globalStudentsDB.push({
            name: student.name, dorm: "2", room: room.id, fac: student.fac, contract: student.contract, group: student.group
        });
    });
});

// +++ Добавлены пропсы initialRoomId и onDownloadClick
const DormMap = ({ dormId, onBack, onGoToDashboard, onLogout, initialRoomId, onDownloadClick }) => {
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

    const zoomLayerRef = useRef(null);
    const mapAreaRef = useRef(null);
    const globalSearchRef = useRef(null);
    const currentFloorRef = useRef(1);

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

    const prepareSVG = useCallback(() => {
        if (!svgContent || !svgContent.includes('<svg')) return;
        
        setTimeout(() => {
            const roomIds = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15"];
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
            updateMapColors();
        }, 50);
    }, [svgContent, currentFloor]);

    const updateMapColors = useCallback(() => {
        document.querySelectorAll('.map-room').forEach(roomEl => {
            const roomId = roomEl.getAttribute('data-room');
            const roomData = mockData.rooms.find(r => r.id === roomId);
            roomEl.classList.remove('status-free', 'status-partial', 'status-full', 'status-selected');
            if (roomData) {
                const occupied = roomData.students.length;
                if (selectedRoomId === roomId) roomEl.classList.add('status-selected');
                else if (occupied === 0) roomEl.classList.add('status-free');
                else if (occupied < roomData.capacity) roomEl.classList.add('status-partial');
                else roomEl.classList.add('status-full');
            }
        });
    }, [selectedRoomId]);

    useEffect(() => { updateMapColors(); }, [svgContent, selectedRoomId, updateMapColors]);
    useEffect(() => { loadFloor(1); }, [loadFloor]);
    useEffect(() => { prepareSVG(); }, [svgContent, currentFloor, prepareSVG]);

    // +++ Эффект для центрирования на комнате при переходе из поиска
    useEffect(() => {
        if (initialRoomId) {
            // Небольшая задержка, чтобы SVG точно был готов
            const timer = setTimeout(() => {
                goToRoom(initialRoomId);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [initialRoomId]);

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
            setPopupRoom(mockData.rooms.find(r => r.id === id) || null);
            setShowGlobalDropdown(false);
            setShowGlobalFilterDropdown(false);
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

    const goToRoom = (roomId) => {
        setShowGlobalDropdown(false);
        setShowGlobalFilterDropdown(false);
        setPopupRoom(null);
        setSelectedRoomId(null);

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
                setPopupRoom(mockData.rooms.find(r => r.id === roomId) || null);
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

    const executeGlobalSearch = () => {
        const q = globalSearchRef.current?.value.toLowerCase().trim() || '';
        if (!q && activeGlobalFaculties.length === 0) { 
            setGlobalSearchResults([]); 
            setShowGlobalDropdown(false); 
            return; 
        }
        const res = globalStudentsDB.filter(s => {
            const mQ = q ? (s.name.toLowerCase().includes(q) || s.contract.toLowerCase().includes(q)) : true;
            const mF = activeGlobalFaculties.length > 0 ? activeGlobalFaculties.includes(s.fac) : true;
            return mQ && mF;
        });
        setGlobalSearchResults(res);
        setShowGlobalDropdown(true);
    };

    useEffect(() => { executeGlobalSearch(); }, [activeGlobalFaculties]);

    const localSearch = () => {
        const q = localSearchQuery.toLowerCase().trim();
        const f = localFacultyFilter;
        if (!q && f === 'all') return <p className="empty-msg">Введите запрос для поиска</p>;
        const cards = [];
        mockData.rooms.forEach(r => {
            const matched = r.students.filter(s => (q ? (s.name.toLowerCase().includes(q) || s.contract.toLowerCase().includes(q)) : true) && (f === 'all' || s.fac === f));
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
                                            <div className="res-name">{s.name}</div>
                                            <div className="res-details">Общ.{s.dorm} | Комн.{s.room} | {s.fac}</div>
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
                    {/* +++ Кнопка "СКАЧАТЬ ТАБЛИЦУ" */}
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
                                    <div key={i} className="student-entry"><b>{s.name}</b><br/>{s.fac} | {s.group}</div>
                                ))}
                                {popupRoom.students.length===0 && <p>Комната пуста</p>}
                            </div>
                        </div>
                    )}

                    <div className="floor-switcher">
                        {[1,2,3].map(f=>(
                            <button key={f} className={`floor-btn ${currentFloor===f?'active':''}`} onClick={()=>changeFloor(f)}>{f} Этаж</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DormMap;