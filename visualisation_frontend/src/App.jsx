import React, { useState, useEffect } from 'react'; // добавлен useEffect
import LoginPage from './pages/LoginPage';
import CampusCards from './pages/CampusCards';
import Dashboard from './pages/Dashboard';
import DormitoryStats from './pages/DormitoryStats';
import Download from './pages/Download';
import DormMap from './pages/DormMap';
import Header from './components/Header';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [selectedDorm, setSelectedDorm] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');   // <-- новое

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const storedUserName = localStorage.getItem('userName');
    if (userId) {
      setCurrentPage('cards');
      if (storedUserName) setUserName(storedUserName);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    // после успешного логина имя уже в localStorage, обновляем состояние
    setUserName(localStorage.getItem('userName') || '');
    setCurrentPage('cards');
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');      
    setUserName('');
    setSelectedDorm(null);
    setSelectedRoom(null);
    setCurrentPage('login');
  };

  // Все остальные обработчики остаются без изменений
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

  const handlePersonClick = (dormId, roomId) => {
    setSelectedDorm(dormId);
    setSelectedRoom(roomId);
    setCurrentPage('dormMap');
  };

  const handleOpenDormMap = (dormId) => {
    setSelectedDorm(dormId);
    setSelectedRoom(null);
    setCurrentPage('dormMap');
  };

  // 4. Пока идёт проверка localStorage, ничего не рендерим
  if (loading) {
    return null; // или <div className="loader">Загрузка...</div>
  }

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
          onPersonClick={handlePersonClick}
          userName={userName}
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
          userName={userName}
        />
      )}

      {currentPage === 'dormMap' && (
        <DormMap
          dormId={selectedDorm}
          initialRoomId={selectedRoom}
          onBack={() => {
            setSelectedRoom(null);
            setCurrentPage('dormStats');
          }}
          onGoToDashboard={handleGoToDashboard}
          onDownloadClick={handleGoToDownload}
          onLogout={handleLogout}
          //  userName={userName}
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
          userName={userName}
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