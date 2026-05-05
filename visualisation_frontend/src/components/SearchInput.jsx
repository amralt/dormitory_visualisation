// components/SearchInput.jsx
import React from 'react';

const SearchInput = ({
  value,
  onChange,
  onFocus,
  showDropdown,
  results,
  onResultClick,
  placeholder = 'Поиск...',
}) => (
  <div className="search-input-wrapper" style={{ position: 'relative' }}>
    <svg
      className="search-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
    <input
      type="text"
      className="search-input"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
    />
    {showDropdown && results && (
      <div className="search-results-dropdown" style={{ display: 'block' }}>
        {results.length === 0 ? (
          <div className="no-res">Нет результатов</div>
        ) : (
          results.map((item, idx) => (
            <div
              key={idx}
              className="search-result-item"
              onClick={() => onResultClick(item)}
            >
              <div className="res-name">{item.name}</div>
              <div className="res-details">
                <span>{item.details}</span>
                <span className="res-dorm-badge">{item.badge}</span>
              </div>
            </div>
          ))
        )}
      </div>
    )}
  </div>
);

export default SearchInput;