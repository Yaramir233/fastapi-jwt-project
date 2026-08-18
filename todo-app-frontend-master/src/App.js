import React, { useCallback, useEffect, useState } from 'react';
import api, { fetchCurrentUser, getErrorText } from './api';
import AuthForm from './AuthForm';
import { clearToken, isAuthenticated } from './auth';
import './App.css';

function getTaskTitle(task) {
  return task.title ?? task.text ?? '';
}

function getTaskCompleted(task) {
  return Boolean(task.completed ?? task.is_done ?? false);
}

function getCategoryName(category) {
  return category.name ?? category.title ?? '';
}

function App() {
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeView, setActiveView] = useState('tasks');

  const [taskTitle, setTaskTitle] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskOriginal, setEditingTaskOriginal] = useState(null);
  const [taskStatusMessage, setTaskStatusMessage] = useState('');

  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState([]);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryOriginal, setEditingCategoryOriginal] = useState(null);
  const [categoryStatusMessage, setCategoryStatusMessage] = useState('');

  const completedCount = tasks.filter((task) => getTaskCompleted(task)).length;
  const pendingCount = tasks.length - completedCount;

  const resetTaskForm = () => {
    setTaskTitle('');
    setIsCompleted(false);
    setEditingTaskId(null);
    setEditingTaskOriginal(null);
  };

  const resetCategoryForm = () => {
    setCategoryName('');
    setEditingCategoryId(null);
    setEditingCategoryOriginal(null);
  };

  const handleLogout = useCallback(() => {
    clearToken();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setTasks([]);
    setCategories([]);
    resetTaskForm();
    resetCategoryForm();
  }, []);

  const verifySession = useCallback(async () => {
    if (!isAuthenticated()) {
      setIsLoggedIn(false);
      setCurrentUser(null);
      setIsAuthChecked(true);
      return;
    }

    try {
      const user = await fetchCurrentUser();
      setCurrentUser(user);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Session check failed:', error);
      handleLogout();
    } finally {
      setIsAuthChecked(true);
    }
  }, [handleLogout]);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  useEffect(() => {
    const onLogout = () => handleLogout();
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, [handleLogout]);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTaskStatusMessage('Ошибка при загрузке задач');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategoryStatusMessage('Ошибка при загрузке категорий');
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchTasks();
    fetchCategories();
  }, [isLoggedIn]);

  const handleAuthSuccess = async () => {
    await verifySession();
  };

  const handleTaskSubmit = async () => {
    const title = taskTitle.trim();
    if (!title) return;

    try {
      if (editingTaskId) {
        const patchData = {};

        if (!editingTaskOriginal || title !== editingTaskOriginal.title) {
          patchData.title = title;
        }
        if (!editingTaskOriginal || isCompleted !== editingTaskOriginal.completed) {
          patchData.completed = isCompleted;
        }

        if (Object.keys(patchData).length === 0) {
          setTaskStatusMessage('Изменений нет');
          return;
        }

        await api.patch(`/tasks/${editingTaskId}`, patchData);
        setTaskStatusMessage('Задача обновлена');
      } else {
        await api.post('/tasks', { title });
        setTaskStatusMessage('Задача создана');
      }

      resetTaskForm();
      fetchTasks();
    } catch (error) {
      console.error('Error submitting task:', error);
      setTaskStatusMessage(`Ошибка: ${getErrorText(error)}`);
    }
  };

  const handleCategorySubmit = async () => {
    const name = categoryName.trim();
    if (!name) return;

    try {
      if (editingCategoryId) {
        const patchData = {};

        if (!editingCategoryOriginal || name !== editingCategoryOriginal.name) {
          patchData.name = name;
        }

        if (Object.keys(patchData).length === 0) {
          setCategoryStatusMessage('Изменений нет');
          return;
        }

        await api.patch(`/categories/${editingCategoryId}`, patchData);
        setCategoryStatusMessage('Категория обновлена');
      } else {
        await api.post('/categories', { name });
        setCategoryStatusMessage('Категория создана');
      }

      resetCategoryForm();
      fetchCategories();
    } catch (error) {
      console.error('Error submitting category:', error);
      setCategoryStatusMessage(`Ошибка: ${getErrorText(error)}`);
    }
  };

  const handleTaskEdit = (task) => {
    const originalTitle = getTaskTitle(task);
    const originalCompleted = getTaskCompleted(task);

    setTaskTitle(originalTitle);
    setIsCompleted(originalCompleted);
    setEditingTaskId(task.id);
    setEditingTaskOriginal({
      title: originalTitle,
      completed: originalCompleted,
    });
    setTaskStatusMessage('');
  };

  const handleCategoryEdit = (category) => {
    const originalName = getCategoryName(category);

    setCategoryName(originalName);
    setEditingCategoryId(category.id);
    setEditingCategoryOriginal({
      name: originalName,
    });
    setCategoryStatusMessage('');
  };

  const handleToggleCompleted = async (task) => {
    try {
      await api.patch(`/tasks/${task.id}`, {
        completed: !getTaskCompleted(task),
      });
      fetchTasks();
    } catch (error) {
      console.error('Error toggling task status:', error);
      setTaskStatusMessage(`Ошибка: ${getErrorText(error)}`);
    }
  };

  const handleTaskDelete = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      if (editingTaskId === id) {
        resetTaskForm();
      }
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      setTaskStatusMessage(`Ошибка: ${getErrorText(error)}`);
    }
  };

  const handleCategoryDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      if (editingCategoryId === id) {
        resetCategoryForm();
      }
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      setCategoryStatusMessage(`Ошибка: ${getErrorText(error)}`);
    }
  };

  if (!isAuthChecked) {
    return (
      <div className="app-shell">
        <main className="App auth-app">
          <section className="panel auth-panel">
            <div className="empty-state">Проверка сессии...</div>
          </section>
        </main>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="app-shell">
      <main className="App">
        <header className="hero">
          <div className="hero-head">
            <div>
              <h1>Мои задачи</h1>
              {currentUser && <p className="user-badge">Пользователь: {currentUser.username}</p>}
            </div>
            <div className="hero-actions">
              <div className="view-switcher" role="tablist" aria-label="Переключатель разделов">
                <button
                  className={activeView === 'tasks' ? 'switch-btn active' : 'switch-btn'}
                  onClick={() => setActiveView('tasks')}
                  type="button"
                >
                  Задачи
                </button>
                <button
                  className={activeView === 'categories' ? 'switch-btn active' : 'switch-btn'}
                  onClick={() => setActiveView('categories')}
                  type="button"
                >
                  Категории
                </button>
              </div>
              <button className="btn btn-danger" onClick={handleLogout} type="button">
                Выйти
              </button>
            </div>
          </div>
        </header>

        {activeView === 'tasks' ? (
          <>
            <section className="panel editor-panel">
              <div className="input-row">
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleTaskSubmit();
                    }
                  }}
                  placeholder="Введите задачу"
                />
                <button className="btn btn-primary" onClick={handleTaskSubmit} type="button">
                  {editingTaskId ? 'Сохранить' : 'Добавить'}
                </button>
              </div>

              {editingTaskId && (
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={(event) => setIsCompleted(event.target.checked)}
                  />
                  Отметить как выполненную при сохранении
                </label>
              )}

              <div className="action-row">
                <button className="btn" onClick={resetTaskForm} type="button">
                  {editingTaskId ? 'Отменить редактирование' : 'Очистить поле'}
                </button>
              </div>

              {taskStatusMessage && <div className="status-message">{taskStatusMessage}</div>}
            </section>

            <section className="panel tasks-panel">
              <div className="tasks-header">
                <h2>Список задач</h2>
                <button className="btn" onClick={fetchTasks} type="button">
                  Обновить
                </button>
              </div>

              <div className="stats">
                <span className="stat-pill">Всего: {tasks.length}</span>
                <span className="stat-pill">Активных: {pendingCount}</span>
                <span className="stat-pill">Готово: {completedCount}</span>
              </div>

              {tasks.length === 0 ? (
                <div className="empty-state">Пока пусто. Добавьте первую задачу выше.</div>
              ) : (
                <ul>
                  {tasks.map((task, index) => (
                    <li key={task.id} style={{ '--item-index': index }}>
                      <button
                        className={getTaskCompleted(task) ? 'toggle done' : 'toggle'}
                        onClick={() => handleToggleCompleted(task)}
                        aria-label="Переключить статус"
                        type="button"
                      >
                        {getTaskCompleted(task) ? '✓' : ''}
                      </button>

                      <div className="task-content">
                        <span className={getTaskCompleted(task) ? 'task-title done' : 'task-title'}>
                          {getTaskTitle(task)}
                        </span>
                        <span className="task-state">{getTaskCompleted(task) ? 'Выполнена' : 'В работе'}</span>
                      </div>

                      <div className="task-actions">
                        <button className="btn" onClick={() => handleTaskEdit(task)} type="button">
                          Изменить
                        </button>
                        <button className="btn btn-danger" onClick={() => handleTaskDelete(task.id)} type="button">
                          Удалить
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : (
          <>
            <section className="panel editor-panel">
              <div className="input-row">
                <input
                  type="text"
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleCategorySubmit();
                    }
                  }}
                  placeholder="Введите категорию"
                />
                <button className="btn btn-primary" onClick={handleCategorySubmit} type="button">
                  {editingCategoryId ? 'Сохранить' : 'Добавить'}
                </button>
              </div>

              <div className="action-row">
                <button className="btn" onClick={resetCategoryForm} type="button">
                  {editingCategoryId ? 'Отменить редактирование' : 'Очистить поле'}
                </button>
              </div>

              {categoryStatusMessage && <div className="status-message">{categoryStatusMessage}</div>}
            </section>

            <section className="panel tasks-panel">
              <div className="tasks-header">
                <h2>Список категорий</h2>
                <button className="btn" onClick={fetchCategories} type="button">
                  Обновить
                </button>
              </div>

              <div className="stats">
                <span className="stat-pill">Всего: {categories.length}</span>
              </div>

              {categories.length === 0 ? (
                <div className="empty-state">Категорий пока нет.</div>
              ) : (
                <ul className="category-list">
                  {categories.map((category, index) => (
                    <li key={category.id} style={{ '--item-index': index }}>
                      <div className="category-mark" aria-hidden="true" />

                      <div className="task-content">
                        <span className="task-title">{getCategoryName(category)}</span>
                        <span className="task-state">{category.id}</span>
                      </div>

                      <div className="task-actions">
                        <button className="btn" onClick={() => handleCategoryEdit(category)} type="button">
                          Изменить
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleCategoryDelete(category.id)}
                          type="button"
                        >
                          Удалить
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
