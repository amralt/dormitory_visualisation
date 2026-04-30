import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import CampusCards from './pages/CampusCards';
import Dashboard from './pages/Dashboard';
import DormitoryStats from './pages/DormitoryStats';
import Download from './pages/Download';
import DormMap from './pages/DormMap';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [selectedDorm, setSelectedDorm] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);   // <-- новое состояние

  const handleLoginSuccess = () => {
    setCurrentPage('cards');
  };

  const handleLogout = () => {
    setSelectedDorm(null);
    setSelectedRoom(null);
    setCurrentPage('login');
  };

  // Клик по карточке общежития → идём на сводку по этажам
  const handleCardClick = (dormId) => {
    setSelectedDorm(dormId);
    setSelectedRoom(null);
    setCurrentPage('dormStats');
  };

  const handleGoToDashboard = () => {
    setCurrentPage('dashboard');
  };

  const handleGoToDownload = () => {
    setCurrentPage('download');
  };

  // Новый обработчик: переход на карту с конкретной комнатой (из поиска по людям)
  const handlePersonClick = (dormId, roomId) => {
    setSelectedDorm(dormId);
    setSelectedRoom(roomId);
    setCurrentPage('dormMap');
  };

  // Переход на карту из сводки (без комнаты)
  const handleOpenDormMap = (dormId) => {
    setSelectedDorm(dormId);
    setSelectedRoom(null);
    setCurrentPage('dormMap');
  };

  return (
    <div className="App">
      {currentPage === 'login' && (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}

      {currentPage === 'cards' && (
        <CampusCards
          onCardClick={handleCardClick}
          onStatClick={handleGoToDashboard}
          onDownloadClick={handleGoToDownload}
          onLogout={handleLogout}
          onPersonClick={handlePersonClick}    // <-- передаём новый пропс
        />
      )}

      {currentPage === 'dormStats' && (
        <DormitoryStats
          dormId={selectedDorm}
          onBack={() => setCurrentPage('cards')}
          onGoToDashboard={handleGoToDashboard}
          onDownloadClick={handleGoToDownload}
          onLogout={handleLogout}
          onOpenMap={handleOpenDormMap}
        />
      )}

      {currentPage === 'dormMap' && (
        <DormMap
          dormId={selectedDorm}
          initialRoomId={selectedRoom}        // <-- передаём ID комнаты
          onBack={() => {
            setSelectedRoom(null);
            setCurrentPage('dormStats');
          }}
          onGoToDashboard={handleGoToDashboard}
          onDownloadClick={handleGoToDownload}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'dashboard' && (
        <Dashboard
          dormId={selectedDorm}
          onBack={() => {
            selectedDorm ? setCurrentPage('dormStats') : setCurrentPage('cards');
          }}
          onDownloadClick={handleGoToDownload}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'download' && (
        <Download
          onBack={() => {
            setCurrentPage('cards');
            setSelectedDorm(null);
            setSelectedRoom(null);
          }}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;