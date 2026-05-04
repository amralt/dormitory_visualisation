// Порядок отображения общежитий
export const dormOrder = ['1А', '1Б', '2', '3', '4', '5', '6', '7', '8/1', '8/2', '9', '10'];

// Статистика для карточек и дашбордов
export const dormStats = {
    '1А': { name: "Общежитие №1А", total: 400, occ: 380, free: 10, res: 5, rep: 5, faculties: { 'ФИТ': 200, 'ММФ': 180 } },
    '1Б': { name: "Общежитие №1Б", total: 400, occ: 350, free: 20, res: 10, rep: 20, faculties: { 'ММФ': 200, 'ФЕН': 150 } },
    '2': { name: "Общежитие №2", total: 450, occ: 420, free: 20, res: 5, rep: 5, faculties: { 'ФФ': 220, 'ФИТ': 200 } },
    '3': { name: "Общежитие №3", total: 500, occ: 490, free: 5, res: 0, rep: 5, faculties: { 'ФЕН': 290, 'ИМПЗ': 200 } },
    '4': { name: "Общежитие №4", total: 450, occ: 400, free: 30, res: 10, rep: 10, faculties: { 'ГГФ': 250, 'ФИЯ': 150 } },
    '5': { name: "Общежитие №5", total: 600, occ: 550, free: 40, res: 10, rep: 0, faculties: { 'ФФ': 300, 'ММФ': 250 } },
    '6': { name: "Общежитие №6", total: 700, occ: 600, free: 50, res: 30, rep: 20, faculties: { 'ГИ': 300, 'Эконом': 300 } },
    '7': { name: "Общежитие №7", total: 650, occ: 600, free: 50, res: 0, rep: 0, faculties: { 'Эконом': 400, 'ФилФак': 200 } },
    '8/1': { name: "Общежитие №8/1", total: 400, occ: 380, free: 20, res: 0, rep: 0, faculties: { 'ФИТ': 380 } },
    '8/2': { name: "Общежитие №8/2", total: 400, occ: 390, free: 5, res: 5, rep: 0, faculties: { 'ФИТ': 150, 'ММФ': 240 } },
    '9': { name: "Общежитие №9", total: 500, occ: 480, free: 10, res: 5, rep: 5, faculties: { 'ФЕН': 250, 'МЕД': 230 } },
    '10': { name: "Общежитие №10", total: 550, occ: 500, free: 30, res: 10, rep: 10, faculties: { 'Эконом': 250, 'ЮФ': 250 } }
};

// База данных студентов для поиска и выгрузки Excel
// Именно этот массив импортируется в Download.jsx
export const studentsDb = [
    { name: "Петров Александр Иванович", dorm: "2", room: "116", fac: "ММФ", contract: "MM-101", group: "19101" },
    { name: "Иванов Сергей Викторович", dorm: "2", room: "116", fac: "ММФ", contract: "MM-102", group: "19101" },
    { name: "Сидоров Артем Павлович", dorm: "2", room: "114", fac: "ФИТ", contract: "FIT-501", group: "20203" },
    { name: "Никитин Константин Сергеевич", dorm: "1А", room: "101", fac: "ФИТ", contract: "FIT-505", group: "20204" },
    { name: "Алексеев Иван Андреевич", dorm: "2", room: "105", fac: "Эконом", contract: "EC-201", group: "21305" },
    { name: "Титов Алексей Николаевич", dorm: "5", room: "201", fac: "ММФ", contract: "MM-201", group: "19105" },
    { name: "Ершов Владислав Дмитриевич", dorm: "5", room: "205", fac: "ФФ", contract: "PH-301", group: "18109" },
    { name: "Громов Илья Михайлович", dorm: "4", room: "315", fac: "ГГФ", contract: "GGF-301", group: "20401" },
    { name: "Захаров Иван Петрович", dorm: "1А", room: "505", fac: "ФФ", contract: "555666", group: "20201" },
    { name: "Смирнов Дмитрий Юрьевич", dorm: "1Б", room: "210", fac: "Эконом", contract: "298383", group: "20301" },
    { name: "Кузнецова Анна Сергеевна", dorm: "3", room: "302", fac: "ИМПЗ", contract: "MED-101", group: "22102" },
    { name: "Морозова Елена Игоревна", dorm: "7", room: "412", fac: "ФилФак", contract: "FIL-202", group: "21501" }
];