import React, { useState } from 'react';
import { getErrorText, login, register } from './api';
import { setToken } from './auth';

function AuthForm({ onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setStatusMessage('Заполните логин и пароль');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('');

    try {
      if (mode === 'register') {
        await register(trimmedUsername, trimmedPassword);
      }

      const tokenData = await login(trimmedUsername, trimmedPassword);
      setToken(tokenData.access_token);
      onAuthSuccess();
    } catch (error) {
      setStatusMessage(getErrorText(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <main className="App auth-app">
        <section className="panel auth-panel">
          <header className="auth-header">
            <h1>Мои задачи</h1>
            <p>Войдите или создайте аккаунт, чтобы управлять задачами и категориями.</p>
          </header>

          <div className="view-switcher auth-switcher" role="tablist" aria-label="Режим авторизации">
            <button
              className={mode === 'login' ? 'switch-btn active' : 'switch-btn'}
              onClick={() => {
                setMode('login');
                setStatusMessage('');
              }}
              type="button"
            >
              Вход
            </button>
            <button
              className={mode === 'register' ? 'switch-btn active' : 'switch-btn'}
              onClick={() => {
                setMode('register');
                setStatusMessage('');
              }}
              type="button"
            >
              Регистрация
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Логин</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="username"
                autoComplete="username"
              />
            </label>

            <label className="auth-field">
              <span>Пароль</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="минимум 6 символов"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </label>

            <button className="btn btn-primary auth-submit" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Подождите...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>

          {statusMessage && <div className="status-message auth-status">{statusMessage}</div>}
        </section>
      </main>
    </div>
  );
}

export default AuthForm;
