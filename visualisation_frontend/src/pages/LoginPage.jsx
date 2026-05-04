import React, { useState } from 'react';
import { login } from './api';
import './LoginPage.css';

const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(false);
    try {
      await login(username, password);
      onLoginSuccess();
    } catch (err) {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="login-page-container">
      <h1 className="main-title">Статистика расселения студентов в общежитиях</h1>
      <div className={`login-box ${shake ? 'shake-animation' : ''}`}>
        <h2>Вход в систему</h2>
        {error && <div className="login-error">Неверный логин или пароль</div>}
        <div className="input-group">
          <input
            type="text"
            className="login-input"
            placeholder="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            className="login-input"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <button className="login-btn" onClick={handleLogin} disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;