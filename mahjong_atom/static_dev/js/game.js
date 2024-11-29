document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const shuffleButton = document.getElementById('shuffle-button');
    const saveButton = document.getElementById('save-button');
    const scoreElement = document.getElementById('score');
    let selectedTiles = [];
    let score = 0;

    // Блокировка плиток на нижних слоях
    function lockLowerLayers() {
        const allTiles = document.querySelectorAll('.tile');
        allTiles.forEach(tile => {
            if (parseInt(tile.dataset.layer) > 1) {  // Если плитка на нижнем слое
                tile.classList.add('locked');  // Блокируем плитку
            }
        });
    }

    // Разблокировка плиток на нижних слоях
    function unlockLowerLayers() {
        const allTiles = document.querySelectorAll('.tile');
        allTiles.forEach(tile => {
            if (parseInt(tile.dataset.layer) > 1) {  // Если плитка на нижнем слое
                tile.classList.remove('locked');  // Разблокируем плитку
            }
        });
    }

    // Обработчик клика по плитке
    gameBoard.addEventListener('click', event => {
        const tile = event.target;
        if (!tile.classList.contains('tile') || tile.classList.contains('matched') || tile.classList.contains('locked')) {
            return;  // Игнорируем клик по заблокированным плиткам
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

    // Проверка совпадений
    function checkMatch(tile1, tile2) {
        if (tile1.dataset.value === tile2.dataset.value) {
            tile1.classList.add('matched');
            tile2.classList.add('matched');
            score += 10;
            scoreElement.textContent = score;

            if (score == 100)
            {
                alert("You win");
            }

            // После того как плитки совпали, разблокируем плитки на нижнем слое (если нужно)
            unlockLowerLayers();
        } else {
            tile1.classList.remove('selected');
            tile2.classList.remove('selected');
        }
        selectedTiles = [];
    }

    // Перемешивание плиток
    shuffleButton.addEventListener('click', () => {
        fetch('/shuffle/', {
            method: 'POST',
            headers: { 'X-CSRFToken': getCookie('csrftoken') }
        })
        .then(response => response.json())
        .then(data => {
            updateBoard(data.field);
            unlockLowerLayers(); // Разблокируем плитки после перемешивания
        });
    });

    // Сохранение результатов
    saveButton.addEventListener('click', () => {
        const playerName = prompt('Enter your name:');
        fetch('/save_results/', {
            method: 'POST',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            body: JSON.stringify({ name: playerName, score: score })
        })
        .then(response => response.json())
        .then(data => {
            alert('Results saved!');
        });
    });

    // Обновление игрового поля
    function updateBoard(field) {
        gameBoard.innerHTML = '';
        field.forEach(layer => {
            const layerDiv = document.createElement('div');
            layerDiv.classList.add('layer');
            layer.forEach(tileValue => {
                const tileDiv = document.createElement('div');
                tileDiv.classList.add('tile');
                tileDiv.dataset.value = tileValue;
                tileDiv.textContent = tileValue;
                layerDiv.appendChild(tileDiv);
            });
            gameBoard.appendChild(layerDiv);
        });
    }

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
});
