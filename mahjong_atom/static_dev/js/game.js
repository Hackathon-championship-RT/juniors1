document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const shuffleButton = document.getElementById('shuffle-button');
    const saveButton = document.getElementById('save-button');
    const scoreElement = document.getElementById('score');
    const timerElement = document.getElementById('timer');
    let selectedTiles = [];
    let score = 0;
    let startTime = null;
    let timerInterval = null;

    // Пример логотипов автомобильных брендов
    const brands = ["Toyota", "BMW", "Ford", "Audi", "Honda", "Chevrolet", "Tesla", "Nissan", "Kia", "Hyundai"];

    // Функция генерации игрового поля
    function generateField() {
        let tiles = [...brands, ...brands]; // Дублируем массив для парных плиток
        tiles = shuffleArray(tiles); // Перемешиваем плитки

        let layers = 3; // Количество слоев
        let field = Array(layers).fill().map(() => []); // Массив для слоев

        // Разделяем плитки на слои
        tiles.forEach((tile, index) => {
            let layerIndex = index % layers;
            field[layerIndex].push(tile);
        });

        return field;
    }

    // Функция случайного перемешивания массива
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Меняем элементы местами
        }
        return array;
    }

    // Обновление игрового поля
    function updateBoard(field) {
        gameBoard.innerHTML = ''; // Очищаем игровое поле

        field.forEach((layer, layerIndex) => {
            const layerDiv = document.createElement('div');
            layerDiv.classList.add('layer');
            layerDiv.dataset.layer = layerIndex + 1; // Задаем номер слоя

            layer.forEach((tileValue, index) => {
                const tileDiv = document.createElement('div');
                tileDiv.classList.add('tile');
                tileDiv.dataset.value = tileValue;
                tileDiv.textContent = tileValue;
                tileDiv.style.top = `${Math.random() * 400}px`; // Случайная позиция по вертикали
                tileDiv.style.left = `${Math.random() * 400}px`; // Случайная позиция по горизонтали
                tileDiv.dataset.layer = layerIndex + 1;

                layerDiv.appendChild(tileDiv);
            });

            gameBoard.appendChild(layerDiv);
        });
    }

    // Функция запуска таймера
    function startTimer() {
        startTime = new Date(); // Запоминаем время начала игры
        timerInterval = setInterval(() => {
            const elapsedTime = Math.floor((new Date() - startTime) / 1000); // Прошедшее время в секундах
            const minutes = Math.floor(elapsedTime / 60);
            const seconds = elapsedTime % 60;
            timerElement.textContent = `Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }, 1000);
    }

    // Остановка таймера
    function stopTimer() {
        clearInterval(timerInterval);
    }

    // Обработчик кликов по плиткам
    gameBoard.addEventListener('click', event => {
        const tile = event.target.closest('.tile');
        if (!tile || tile.classList.contains('matched') || tile.classList.contains('selected')) {
            return;
        }

        if (selectedTiles.length < 2) {
            tile.classList.add('selected');
            selectedTiles.push(tile);

            if (selectedTiles.length === 2) {
                setTimeout(() => {
                    checkMatch(selectedTiles[0], selectedTiles[1]);
                }, 500);
            }
        }
    });

    startTimer(); // Стартуем таймер

    // Проверка совпадений
    function checkMatch(tile1, tile2) {
        if (tile1.dataset.value === tile2.dataset.value) {
            tile1.classList.add('matched');
            tile2.classList.add('matched');
            score += 10;

            scoreElement.textContent = score;
            checkGameEnd();
        } else {
            tile1.classList.remove('selected');
            tile2.classList.remove('selected');
        }
        selectedTiles = [];
    }

    // Перемешивание плиток
    shuffleButton.addEventListener('click', () => {
        const field = generateField(); // Генерируем случайное поле
        updateBoard(field);
    });

    // Сохранение результатов
    saveButton.addEventListener('click', () => {
        const playerName = prompt('Enter your name:');
        const elapsedTime = Math.floor((new Date() - startTime) / 1000);
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;

        fetch('/save_results/', {
            method: 'POST',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            body: JSON.stringify({ name: playerName, score: score, time: `${minutes}:${seconds}` })
        })
        .then(response => response.json())
        .then(data => {
            alert('Results saved!');
            stopTimer(); // Остановка таймера при сохранении
        });
    });

    // Получение CSRF-токена
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    function checkGameEnd() {
        // Проверяем, остались ли плитки без класса 'matched'
        const unmatchedTiles = document.querySelectorAll('.tile:not(.matched)');
        if (unmatchedTiles.length === 0) {
            stopTimer(); // Останавливаем таймер

            const elapsedTime = Math.floor((new Date() - startTime) / 1000);  // Получаем время в секундах

            // Отправляем только время (в секундах)
            fetch('/game/save_results/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    time: elapsedTime  // Отправляем только время в секундах
                })
            })
            .then(response => response.json())
            .then(data => {
                window.location.href = '/';
                stopTimer(); // Остановка таймера при сохранении
            });
        }
    }

    // Запускаем игру
    const initialField = generateField();
    updateBoard(initialField);
});
