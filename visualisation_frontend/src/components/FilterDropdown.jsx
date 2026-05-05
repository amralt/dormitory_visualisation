// components/FilterDropdown.jsx
import React, { useState, useRef, useEffect } from 'react';

const FilterDropdown = ({
  items,                  // массив строк (названия факультетов)
  selectedItems,          // массив выбранных
  onToggle,               // (item) => void
  onClear,                // () => void
  label = 'Фильтры',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="header-filter-wrapper" ref={ref} style={{ position: 'relative' }}>
      <button className="filter-btn" onClick={() => setOpen(!open)}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        {label}
      </button>
      {open && (
        <div className="header-filter-dropdown show">
          <b>Выберите факультеты:</b>
          {items.map((item) => (
            <label key={item}>
              <input
                type="checkbox"
                checked={selectedItems.includes(item)}
                onChange={() => onToggle(item)}
              />
              {item}
            </label>
          ))}
          {selectedItems.length > 0 && (
            <button
              onClick={() => {
                onClear();
                setOpen(false);
              }}
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
  );
};

export default FilterDropdown;