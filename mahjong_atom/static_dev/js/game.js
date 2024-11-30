document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const shuffleButton = document.getElementById('shuffle-button');
    const saveButton = document.getElementById('save-button');
    const cardsCountElement = document.getElementById('cards-count');
    const timerElement = document.getElementById('timer');
    const undoButton = document.getElementById('undo-button');
    let selectedTiles = [];
    let startTime = null;
    let timerInterval = null;
    let count_shuffled = 0;
    const gameStates = []; // Хранилище состояний игры

    // Функция для создания копии текущего игрового состояния
    function saveGameState() {
        const currentState = Array.from(document.querySelectorAll('.tile')).map(tile => ({
            id: tile.dataset.id,
            value: tile.dataset.value,
            isMatched: tile.classList.contains('matched'),
            isSelected: tile.classList.contains('selected')
        }));
        gameStates.push(currentState);
    }

    // Функция для восстановления последнего состояния
    function restoreLastState() {
        if (gameStates.length > 0) {
            const lastState = gameStates.pop(); // Достаем последнее сохраненное состояние

            // Получаем все плитки
            const tiles = Array.from(document.querySelectorAll('.tile'));

            tiles.forEach((tile, index) => {
                const state = lastState[index];

                tile.className = 'tile';

                if (state.isMatched) {
                    tile.classList.add('matched'); // Плитка совпала
                } else if (state.isSelected) {
                    // Убираем selected при возврате
                    tile.classList.remove('selected');
                }

                if (!state.isMatched && !state.isSelected) {
                    tile.classList.remove('matched', 'selected');
                }
            });

            // Очищаем массив выбранных плиток
            selectedTiles = [];
        }
    }

    // Функция обновления количества оставшихся карточек
    function updateRemainingCards() {
        const visibleTiles = Array.from(document.querySelectorAll('.tile:not(.matched)'));
        cardsCountElement.textContent = visibleTiles.length; // Обновляем текст с количеством
    }

    updateRemainingCards();
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

    function showMessage(message, duration = 2000) {
        const messageContainer = document.getElementById('message-container');
        messageContainer.textContent = message;
        messageContainer.style.display = 'block';

        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, duration); // Сообщение исчезнет через `duration` миллисекунд
    }


    function updateBoard(shuffledTiles) {
        gameBoard.innerHTML = ''; // Очищаем игровое поле

        shuffledTiles.forEach(layer => {
            const layerDiv = document.createElement('div');
            layerDiv.classList.add('layer'); // Создаем div для слоя

            layer.forEach(tile => {
                if (tile === "") {
                    // Пустая плитка
                    const emptyTileDiv = document.createElement('div');
                    emptyTileDiv.classList.add('tile_pass');
                    layerDiv.appendChild(emptyTileDiv);
                } else {
                    // Плитка с данными
                    const tileDiv = document.createElement('div');
                    tileDiv.classList.add('tile');
                    tileDiv.dataset.value = tile;
                    const tileImg = document.createElement('img');
                    tileImg.src = tile[1]; // URL изображения
                    tileImg.alt = tile[0]; // Название плитки
                    tileImg.width = 80; // Ширина изображения
                    tileImg.height = 60; // Высота изображения

                    tileDiv.appendChild(tileImg);
                    layerDiv.appendChild(tileDiv);
                }
            });

            gameBoard.appendChild(layerDiv);
        });
    }

    shuffleButton.addEventListener('click', () => {
        // Получаем текущие плитки с поля
        const tiles = Array.from(document.querySelectorAll('.tile'))
        .filter(tile => tile.style.visibility !== 'hidden' && tile.style.display !== 'none' && !tile.classList.contains('matched'))
        .map(tile => ({
            id: tile.dataset.id, // Уникальный идентификатор плитки
            value: tile.dataset.value // Значение плитки
        }));

        count_shuffled++;
        // Отправляем запрос на сервер для перемешивания
        fetch('/game/shuffle_tiles/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'), // Получение CSRF-токена
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tiles })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Обновляем игровое поле с перемешанными плитками
                updateBoard(data.shuffled_tiles);
            } else {
                console.error('Ошибка перемешивания:', data.message);
            }
        })
        .catch(error => console.error('Ошибка:', error));
    });


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
        saveGameState();
        if (tile1.dataset.value === tile2.dataset.value) {
            tile1.classList.add('matched');
            tile2.classList.add('matched');

            showMessage(tile1.dataset.modelName);

            updateRemainingCards();
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
        saveGameState();
    });

    undoButton.addEventListener('click', () => {
        restoreLastState();
        updateRemainingCards();
    });

    saveButton.addEventListener('click', () => {
        const playerName = prompt('Enter your name:');
        const elapsedTime = Math.floor((new Date() - startTime) / 1000);
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;

        fetch('/save_results/', {
            method: 'POST',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            body: JSON.stringify({ name: playerName, count_shuffled: count_shuffled, time: `${minutes}:${seconds}` })
        })
        .then(response => response.json())
        .then(data => {
            alert('Results saved!');
            stopTimer(); // Остановка таймера при сохранении
        });
    });

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
                    time: elapsedTime,
                    count_shuffled: count_shuffled,
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

