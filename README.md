# Система визуализации проживания в общежитиях (СтудГородок)

Проект состоит из бэкенда на **FastAPI** и фронтенда на **React (Vite)**.  
Позволяет просматривать заселение по этажам, комнатам, факультетам, выгружать данные в Excel, а также управлять видимостью общежитий и доступом пользователей.

## 📦 Быстрый старт

### 1. Требования
- **Python** 3.10+
- **Node.js** 18+ и **npm**
- **Git** (опционально)

### 2. Клонирование и установка

```
git clone https://github.com/amralt/dormitory_visualisation.git
cd dormitory_visualisation
```

### 3. База данных
В бэкенде по умолчанию используется SQLite‑база dogovory.db, которая создаётся автоматически в корневой папке бэкенда.
скачайте её из https://drive.google.com/file/d/1ex4iBBagW_xEjkbUAyxxZnGasoHCkVF4/view?usp=sharing и вставьте в папку backend

### 4. Запуск проекта:
`dockuer-compose up --build`
