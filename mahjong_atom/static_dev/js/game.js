document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    let selectedTiles = [];
    let score = 0;

    // Инициализация игры: проверяем начальную доступность плиток
    updateAvailableMoves();

    // Обработчик кликов на плитку
    gameBoard.addEventListener('click', (event) => {
        const tile = event.target;

        if (!tile.classList.contains('tile') || !tile.classList.contains('available')) {
            return;
        }

        tile.classList.add('selected');
        selectedTiles.push(tile);

        if (selectedTiles.length === 2) {
            setTimeout(() => {
                checkMatch(selectedTiles[0], selectedTiles[1]);
            }, 500);
        }
    });

    // Проверка совпадений
    function checkMatch(tile1, tile2) {
        if (tile1.dataset.value === tile2.dataset.value) {
            // Удаляем плитки из DOM
            tile1.remove();
            tile2.remove();

            // Обновляем очки
            score += 10;
            document.getElementById('score').textContent = score;

            // Обновляем доступные плитки
            updateAvailableMoves();
        } else {
            // Если не совпали, снимаем выделение
            tile1.classList.remove('selected');
            tile2.classList.remove('selected');
        }
        selectedTiles = [];
    }

    // Обновление доступных плиток
    function updateAvailableMoves() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.classList.remove('available');

            // Плитка доступна, если она не заблокирована
            if (!isBlocked(tile)) {
                tile.classList.add('available');
            }
        });
    }

    // Проверка, заблокирована ли плитка
    function isBlocked(tile) {
        const layer = parseInt(tile.dataset.layer);
        const row = parseInt(tile.dataset.row);
        const col = parseInt(tile.dataset.col);

        // Проверяем плитки выше текущей (layer + 1)
        const tilesAbove = Array.from(document.querySelectorAll(`.tile[data-layer="${layer + 1}"]`));
        return tilesAbove.some(aboveTile => {
            const aboveRow = parseInt(aboveTile.dataset.row);
            const aboveCol = parseInt(aboveTile.dataset.col);

            // Проверяем, перекрывает ли верхняя плитка текущую
            return (
                Math.abs(aboveRow - row) <= 1 &&
                Math.abs(aboveCol - col) <= 1
            );
        });
    }
});
