// 1. Создаем пустую базу данных
const database = {};

// Генерируем стандартные данные для всех 30 комнат циклом
for (let i = 1; i <= 30; i++) {
    database[`room_${i}`] = {
        title: `Кабинет №${100 + i}`,
        description: `Стандартное офисное помещение. Оборудовано рабочими местами. Площадь: 12 кв.м.`
    };
}

// Вручную меняем данные для особых комнат
database['room_1'].title = "Приемная";
database['room_1'].description = "Зона ресепшена и ожидания для гостей. Площадь: 25 кв.м.";

database['room_30'].title = "Кабинет директора";
database['room_30'].description = "Просторный угловой кабинет с панорамными окнами.";


// 2. Вставляем карту из файла map.js в HTML
document.getElementById('map-container').innerHTML = svgMapData;


// 3. --- НОВАЯ ЛОГИКА: Окрашивание комнат ---
// Находим все комнаты на загруженной карте
const allRoomElements = document.querySelectorAll('.room');

allRoomElements.forEach(roomEl => {
    const roomId = roomEl.getAttribute('data-id');

    // Окрашиваем в зависимости от ID
    if (roomId === 'room_1') {
        // Приёмная
        roomEl.classList.add('type-reception');
    } else if (roomId === 'room_30') {
        // Кабинет директора
        roomEl.classList.add('type-director');
    } else {
        // Все остальные - офисы
        roomEl.classList.add('type-office');
    }
});


// 4. Логика интерактивности (клики и модальное окно)
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('close-modal');
const modalTitle = document.getElementById('modal-title');
const modalInfo = document.getElementById('modal-info');

// Используем уже найденные элементы комнат
allRoomElements.forEach(room => {
    room.addEventListener('click', function() {
        // Убираем подсветку со всех комнат
        allRoomElements.forEach(r => r.classList.remove('active'));
        // Красим нажатую (CSS класс .active перекрасит её в фиолетовый)
        this.classList.add('active');

        // Получаем данные из базы
        const roomId = this.getAttribute('data-id');
        const roomData = database[roomId];

        if (roomData) {
            modalTitle.textContent = roomData.title;
            modalInfo.textContent = roomData.description;
            modal.classList.add('show');
        }
    });
});

// Логика закрытия окна (без изменений)
closeModalBtn.addEventListener('click', () => modal.classList.remove('show'));
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
});