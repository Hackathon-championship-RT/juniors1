document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const shuffleButton = document.getElementById('shuffle-button');
    const saveButton = document.getElementById('save-button');
    const cardsCountElement = document.getElementById('cards-count');
    const timerElement = document.getElementById('timer');
    const undoButton = document.getElementById('undo-button');
    const gamePk = document.getElementById('game-board').getAttribute('data-game-pk');
    const lvl = document.getElementById('game-board').getAttribute('data-game-lvl');
    let selectedTiles = [];
    let seconds = 0;
    let timerInterval = null;
    let count_shuffled = 0;
    const gameStates = [];

    let lastMatchedTiles = null;

    function saveGameState() {
        const currentState = Array.from(document.querySelectorAll('.tile')).map(tile => ({
            id: tile.dataset.id,
            value: tile.dataset.value,
            isMatched: tile.classList.contains('matched'),
            isSelected: tile.classList.contains('selected')
        }));
        gameStates.push(currentState);
    }

    function startTimer() {
        timerInterval = setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            timerElement.textContent = `Время: ${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function restoreLastState() {
        if (lastMatchedTiles) {
            const { tile1, tile2 } = lastMatchedTiles;

            tile1.classList.remove('tile_pass', 'matched', 'selected');
            tile2.classList.remove('tile_pass', 'matched', 'selected');

            tile1.style.opacity = '1';
            tile2.style.opacity = '1';
            tile1.style.transform = 'scale(1)';
            tile2.style.transform = 'scale(1)';

            lastMatchedTiles = null;
            updateRemainingCards();
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

    function showMessage(message, duration = 99999999) {
        const messageContainer = document.getElementById('message-container');
        messageContainer.textContent = message;
        messageContainer.style.display = 'block';

        stopTimer();

        messageContainer.addEventListener('click', function hideMessage() {
            messageContainer.style.display = 'none';
            startTimer();
            messageContainer.removeEventListener('click', hideMessage);
        });

        setTimeout(() => {
            if (messageContainer.style.display !== 'none') {
                messageContainer.style.display = 'none';
                startTimer();
            }
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
            body: JSON.stringify({
             tiles: tiles,
             lvl: lvl,
             })
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

    gameBoard.addEventListener('click', event => {
        const tile = event.target.closest('.tile');
        if (!tile || tile.classList.contains('matched')) {
            return;
        }

        if (tile.classList.contains('selected')) {
            tile.classList.remove('selected');
            selectedTiles = selectedTiles.filter(t => t !== tile);
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

            setTimeout(() => {
                tile1.style.opacity = '0';
                tile2.style.opacity = '0';
                tile1.style.transform = 'scale(0)';
                tile2.style.transform = 'scale(0)';

                tile1.classList.add('tile_pass');
                tile2.classList.add('tile_pass');
            }, 500);

            lastMatchedTiles = { tile1, tile2 };
            updateRemainingCards();
            checkGameEnd();
        } else {
            tile1.classList.remove('selected');
            tile2.classList.remove('selected');
        }
        selectedTiles = [];
    }

    undoButton.addEventListener('click', () => {
        restoreLastState();
    });

    saveButton.addEventListener('click', () => {
        const playerName = prompt('Enter your name:');
        const minutes = Math.floor(seconds / 60);
        const second = seconds % 60;

        fetch('/save_results/', {
            method: 'POST',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            body: JSON.stringify({ name: playerName, count_shuffled: count_shuffled, time: `${minutes}:${second}` })
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
            fetch('/game/save_results/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    time: seconds,
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
