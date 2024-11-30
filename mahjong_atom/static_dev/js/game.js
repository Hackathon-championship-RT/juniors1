document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const shuffleButton = document.getElementById('shuffle-button');
    const saveButton = document.getElementById('save-button');
    const cardsCountElement = document.getElementById('cards-count');
    const timerElement = document.getElementById('timer');
    const undoButton = document.getElementById('undo-button');
    const gamePk = document.getElementById('game-board').getAttribute('data-game-pk');
    let selectedTiles = [];
    let startTime = null;
    let timerInterval = null;
    let count_shuffled = 0;
    const gameStates = [];

    function saveGameState() {
        const currentState = Array.from(document.querySelectorAll('.tile')).map(tile => ({
            id: tile.dataset.id,
            value: tile.dataset.value,
            isMatched: tile.classList.contains('matched'),
            isSelected: tile.classList.contains('selected')
        }));
        gameStates.push(currentState);
    }

    function restoreLastState() {
        if (gameStates.length > 0) {
            const lastState = gameStates.pop();

            const tiles = Array.from(document.querySelectorAll('.tile'));

            tiles.forEach((tile, index) => {
                const state = lastState[index];

                tile.className = 'tile';

                if (state.isMatched) {
                    tile.classList.add('matched');
                } else if (state.isSelected) {
                    tile.classList.remove('selected');
                }

                if (!state.isMatched && !state.isSelected) {
                    tile.classList.remove('matched', 'selected');
                }
            });

            selectedTiles = [];
        }
    }

    function updateRemainingCards() {
        const visibleTiles = Array.from(document.querySelectorAll('.tile:not(.matched)'));
        cardsCountElement.textContent = visibleTiles.length;
    }

    updateRemainingCards();

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

    function showMessage(message, duration = 7000) {
        const messageContainer = document.getElementById('message-container');
        messageContainer.textContent = message;
        messageContainer.style.display = 'block';

        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, duration);
    }


    function updateBoard(shuffledTiles) {
        gameBoard.innerHTML = '';

        shuffledTiles.forEach(layer => {
            const layerDiv = document.createElement('div');
            layerDiv.classList.add('layer');

            layer.forEach(tile => {
                if (tile === "") {
                    const emptyTileDiv = document.createElement('div');
                    emptyTileDiv.classList.add('tile_pass');
                    layerDiv.appendChild(emptyTileDiv);
                } else {
                    const tileDiv = document.createElement('div');
                    tileDiv.classList.add('tile');
                    tileDiv.dataset.value = tile;
                    tileDiv.dataset.modelName = tile[2];
                    const tileImg = document.createElement('img');
                    tileImg.src = tile[1];
                    tileImg.alt = tile[0];
                    tileImg.width = 80;
                    tileImg.height = 60;

                    tileDiv.appendChild(tileImg);
                    layerDiv.appendChild(tileDiv);
                }
            });

            gameBoard.appendChild(layerDiv);
        });
    }

    shuffleButton.addEventListener('click', () => {
        const tiles = Array.from(document.querySelectorAll('.tile'))
        .filter(tile => tile.style.visibility !== 'hidden' && tile.style.display !== 'none' && !tile.classList.contains('matched'))
        .map(tile => ({
            id: tile.dataset.id,
            value: tile.dataset.value
        }));

        count_shuffled++;
        fetch('/game/shuffle_tiles/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tiles })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updateBoard(data.shuffled_tiles);
            } else {
                console.error('Ошибка перемешивания:', data.message);
            }
        })
        .catch(error => console.error('Ошибка:', error));
    });


    function startTimer() {
        const timerElement = document.getElementById('timer');
        const startTime = new Date();
        const timerInterval = setInterval(() => {
            const elapsedTime = Math.floor((new Date() - startTime) / 1000);
            const minutes = Math.floor(elapsedTime / 60);
            const seconds = elapsedTime % 60;
            timerElement.textContent = `Время: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

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

    startTimer();

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

    shuffleButton.addEventListener('click', () => {
        const field = generateField();
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
            stopTimer();
        });
    });

    function checkGameEnd() {
        const unmatchedTiles = document.querySelectorAll('.tile:not(.matched)');
        if (unmatchedTiles.length === 0) {
            stopTimer();

            const elapsedTime = Math.floor((new Date() - startTime) / 1000);

            fetch('/game/save_results/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    time: elapsedTime,
                    count_shuffled: count_shuffled,
                    game_pk: gamePk
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    window.location.href = '/game/leaderboard/';
                } else {
                    alert('Ошибка при сохранении результатов.');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                alert('Произошла ошибка при сохранении результатов.');
            });
        }
    }
    const initialField = generateField();
    updateBoard(initialField);
});

