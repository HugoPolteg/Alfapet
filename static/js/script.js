let gameId = null;
let playerId = null;
let playerName = null;
let currentGameState = null;
let draggedTile = null;
let selectedTiles = []
const bricksContainer = document.getElementById("bricks");
const lobbyScreen = document.getElementById('lobby');
const gameScreen = document.getElementById('game');
const createGameBtn = document.getElementById('create-game-btn');
const joinGameBtn = document.getElementById('join-game-btn');
const startGameBtn = document.getElementById('start-game-btn');
function shuffle(array) {
  let currentIndex = array.length;

  while (currentIndex != 0) {

    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}

function addBrick(brickArr, id) {
    let brickCharacter = brickArr[0];
    let brickValue = brickArr[1];
    const newBrick = document.createElement("div");
    newBrick.classList.add("brick");
    newBrick.draggable = true;
    newBrick.dataset.letter = brickCharacter
    newBrick.dataset.value = brickValue
    newBrick.id = "Brick" + id;
    if(brickValue == 0) {
        switch(brickCharacter) {
            case "Blank":
                break;
            case "Black":
                const filling = document.createElement("div");
                filling.classList.add("blackBrick");
                newBrick.appendChild(filling)
                break;
            case "DownRightArrow":
                const img = document.createElement("img");
                img.src = "/static/images/downRight.png";
                img.alt = "Down right arrow";
                img.loading = "lazy";
                img.style.width = "2.2vw";
                newBrick.appendChild(img);
                break;
            case "UpRightArrow":
                const img2 = document.createElement("img");
                img2.src = "/static/images/upRight.png";
                img2.alt = "Up right arrow";
                img2.loading = "lazy";
                img2.style.width = "2.2vw";
                newBrick.appendChild(img2);
                break;
        }
    } else {
        const charDisplay = document.createElement("p");
        charDisplay.textContent = brickCharacter;
        const pointsDisplay = document.createElement("sub");
        pointsDisplay.textContent = brickValue;
        charDisplay.appendChild(pointsDisplay)
        newBrick.appendChild(charDisplay)
        
    }
    newBrick.addEventListener("dragstart", (event) => {
        dragStartHandler(event);
    })
    bricksContainer.appendChild(newBrick);
}

function returnBricks(hand) {
    for(const brickId of hand) {
        const brick = document.getElementById("Brick" + brickId);
        const bricksContainer = document.getElementById("bricks");
        bricksContainer.appendChild(brick)
    }
}

function shuffleHand(hand) {
    shuffle(hand);
    returnBricks(hand);
}

function draw(bag, nrBricks) {
    if(nrBricks > bag.length) {
        nrBricks = bag.length;
    }
    let drawnBricks = [];
    while(nrBricks > 0) {
        drawnBricks.push(bag.pop())
        nrBricks--;
    }
    return drawnBricks
}

function dragStartHandler(ev) {
    let inHand = ev.target.parentElement.id == "bricks"
    let tileId = ev.target.id
    draggedTile = {"id" : tileId, "fromHand" : inHand,
        "value" : ev.target.dataset.value, "letter" : ev.target.dataset.letter}
}

function dragOverHandler(ev) {
    ev.preventDefault();
}

function dropHandler(ev) {
    ev.preventDefault();
    if(!draggedTile) {
        return false;
    }
    const tileId = draggedTile["id"]
    const fromHand = draggedTile["fromHand"]
    if(!fromHand) {
        selectedTiles = selectedTiles.filter(
            item => item['id'] != tileId
        )
    }
    let dragged = document.getElementById(tileId);
    let target = ev.target
    if(target.id != "bricks") {
        target = ev.target.className == "" ? ev.target.parentElement : ev.target;
        if (target.className == "brick") {
            return false
        }
        for(const child of target.children) {
            if (child.className == "brick") {
                return false;
            } else {
                child.style.display = "none";
            }
        }
        target.textContent = "";
        //dict {row, col, letter, value}
        let row = target.dataset.row
        let col = target.dataset.col
        selectedTiles.push({'id': tileId, 'row' : row, "col" : col,
            "letter" : draggedTile['letter'], "value": draggedTile['value']})
    }
    draggedTile = null
    target.appendChild(dragged);
    console.log(selectedTiles)
}



const board = document.getElementById("board")
const boardDimensions = [17, 17]
const boardModel = [
    ["P", "N", "N", "N", "R", "N", "N", "N", "G", "N", "N", "N", "R", "N", "N", "N", "P"],
    ["N", "N", "N", "O", "N", "N", "N", "L", "N", "R", "N", "N", "N", "O", "N", "N", "N"],
    ["N", "N", "B", "N", "N", "N", "O", "N", "N", "N", "O", "N", "N", "N", "B", "N", "N"],
    ["N", "O", "N", "X", "N", "B", "N", "N", "X", "N", "N", "B", "N", "X", "N", "O", "N"],
    ["R", "N", "N", "N", "I", "N", "N", "N", "N", "N", "N", "N", "I", "N", "N", "N", "R"],
    ["N", "N", "N", "B", "N", "X", "N", "N", "L", "N", "N", "X", "N", "B", "N", "N", "N"],
    ["N", "N", "O", "N", "N", "N", "N", "D", "N", "D", "N", "N", "N", "N", "O", "N", "N"],
    ["N", "L", "N", "N", "N", "N", "L", "N", "N", "N", "L", "N", "N", "N", "N", "L", "N"],
    ["G", "N", "N", "X", "N", "Y", "N", "N", "S", "N", "N", "Y", "N", "X", "N", "N", "G"],
    ["N", "L", "N", "N", "N", "N", "L", "N", "N", "N", "L", "N", "N", "N", "N", "L", "N"],
    ["N", "N", "O", "N", "N", "N", "N", "D", "N", "D", "N", "N", "N", "N", "O", "N", "N"],
    ["N", "N", "N", "B", "N", "X", "N", "N", "L", "N", "N", "X", "N", "B", "N", "N", "N"],
    ["R", "N", "N", "N", "I", "N", "N", "N", "N", "N", "N", "N", "I", "N", "N", "N", "R"],
    ["N", "O", "N", "X", "N", "B", "N", "N", "X", "N", "N", "B", "N", "X", "N", "O", "N"],
    ["N", "N", "B", "N", "N", "N", "O", "N", "N", "N", "O", "N", "N", "N", "B", "N", "N"],
    ["N", "N", "N", "O", "N", "N", "N", "L", "N", "R", "N", "N", "N", "O", "N", "N", "N"],
    ["P", "N", "N", "N", "R", "N", "N", "N", "G", "N", "N", "N", "R", "N", "N", "N", "P"]
]
const bricks = {
    "D": {"Value": 1, "Number": 7},
    "O": {"Value": 2, "Number": 5},
    "R": {"Value": 1, "Number": 9},
    "Ä": {"Value": 4, "Number": 2},
    "S": {"Value": 1, "Number": 8},
    "Å": {"Value": 4, "Number": 2},
    "E": {"Value": 1, "Number": 8},
    "T": {"Value": 1, "Number": 7},
    "Blank": {"Value": 0, "Number": 2},
    "L": {"Value": 1, "Number": 7},
    "A": {"Value": 1, "Number": 9},
    "F": {"Value": 4, "Number": 2},
    "Ö": {"Value": 4, "Number": 2},
    "I": {"Value": 1, "Number": 6},
    "N": {"Value": 1, "Number": 7},
    "Y": {"Value": 8, "Number": 2},
    "H": {"Value": 3, "Number": 3},
    "M": {"Value": 3, "Number": 3},
    "G": {"Value": 2, "Number": 4},
    "B": {"Value": 4, "Number": 2},
    "K": {"Value": 3, "Number": 3},
    "C": {"Value": 8, "Number": 2},
    "X": {"Value": 10, "Number": 1},
    "P": {"Value": 3, "Number": 3},
    "V": {"Value": 4, "Number": 2},
    "Z": {"Value": 10, "Number": 1},
    "J": {"Value": 8, "Number": 1},
    "U": {"Value": 3, "Number": 3},
    "Q": {"Value": 10, "Number": 1},
    "Black": {"Value": 0, "Number": 2},
    "DownRightArrow": {"Value": 0, "Number": 2},
    "UpRightArrow": {"Value": 0, "Number": 2},
};

let brickBag = [];
for(const [key, value] of Object.entries(bricks)) {
    for(let i = 0; i < value["Number"]; i++) {
        brickBag.push([key, value["Value"]]);
    }
}
shuffle(brickBag)
boardArray = []
for(let i = 0; i < boardDimensions[0]; i++) {
    let row = document.createElement("div");
    row.className = "row";
    boardArray.push([])
    for(let x = 0; x < boardDimensions[1]; x++) {
        let tile = document.createElement("div");
        tile.classList.add("tile");
        tile.dataset.row = i
        tile.dataset.col = x
        let tileType = boardModel[i][x]
        switch(tileType) {
            case "S":
                const img = document.createElement("img");
                img.src = "/static/images/star.png";
                img.alt = "Star";
                img.loading = "lazy";
                img.style.width = "2.2vw";
                tile.classList.add("redTile");
                tile.appendChild(img);
                break;
            case "N":
                tile.classList.add("normalTile");
                break;
            case "L":
                tile.textContent = "2L";
                tile.classList.add("lightGreenTile");
                break;
            case "R":
                tile.textContent = "2L";
                tile.classList.add("redTile");
                break;
            case "D":
                tile.textContent = "2L";
                tile.classList.add("darkGreenTile")
                break;
            case "O":
                tile.textContent = "3L";
                tile.classList.add("orangeTile");
                break;
            case "I":
                tile.textContent = "4L";
                tile.classList.add("pinkTile");
                break;
            case "X":
                tile.textContent = "4L";
                tile.classList.add("blackTile");
                break;
            case "B":
                tile.textContent = "2W";
                tile.classList.add("blueTile");
                break;
            case "Y":
                tile.textContent = "2W";
                tile.classList.add("aquaTile")
                break;
            case "G":
                tile.textContent = "3W";
                tile.classList.add("greenTile");
                break;
            case "P":
                tile.textContent = "4W";
                tile.classList.add("purpleTile")
                break;
        }
        
        tile.addEventListener("drop", (event) => {
            dropHandler(event);
        });
        tile.addEventListener("dragover", (event) => {
            dragOverHandler(event);
        });
        if(tileType == "S") {
            const img2 = tile.firstChild
            img2.addEventListener("drop", () => {
                return false;
            })
        }
        boardArray[i].push(tile);
        row.appendChild(tile);
    }
    board.appendChild(row);
}
function showWaitingRoom() {
    document.querySelector('.lobby-options').style.display = 'none';
    document.getElementById('waiting-room').style.display = 'block';
    document.getElementById('waiting-game-id').textContent = gameId;
}

function showGameScreen() {
    lobbyScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    document.getElementById('game-id-display').textContent = `Game: ${gameId}`;
    document.getElementById('player-name-display').textContent = `Player: ${playerName}`;
    renderBoard();
}

async function createGame() {
    playerName = document.getElementById('create-player-name').value || 'Player 1';
    try {
        const response = await fetch('/api/game/create', {
            method : 'POST',
            headers : {'Content-Type' : 'application/json'},
            body : JSON.stringify({player_name : playerName})
            
        });
        const data = await response.json();
        gameId = data.game_id;
        playerID = data.playerID
        showWaitingRoom();
        startPolling();
    } catch (error) {   
        console.error('Error creating game:', error);
        alert('Failed to create game. Please try again.');
    }
}
async function fetchGameState() {
    try {
        const response = await fetch(`/api/game/${gameId}/state?player_id=${playerId}`);
        const data = await response.json();
        currentGameState = data;
        updateGameDisplay();
        return data;
    } catch (error) {
        console.error('Error fetching game state:', error);
    }
}

async function playWord() {
    if (selectedTiles.length === 0) {
        alert('Please place tiles on the board first!');
        return;
    }
    
    try {
        const response = await fetch(`/api/game/${gameId}/play`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_id: playerId,
                tiles: selectedTiles
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.error || 'Invalid move');
            return;
        }
        
        const data = await response.json();
        addLogMessage(`Word played! Score: ${data.score}`);
        selectedTiles = [];
        await fetchGameState();
    } catch (error) {
        console.error('Error playing word:', error);
        alert('Failed to play word. Please try again.');
    }
}
let currBrickId = 0;
let drawnBricks = draw(brickBag, 8);
let hand = []
for(let i = 0; i < drawnBricks.length; i++) {
    addBrick(drawnBricks[i], currBrickId)
    hand.push(currBrickId)
    currBrickId++;
}

const shuffleButton = document.getElementById("shuffle");
shuffleButton.addEventListener("click", () => {
    shuffleHand(hand)
})
const returnButton = document.getElementById("return");
returnButton.addEventListener("click", () => {
    returnBricks(hand)
})
const playButton = document.getElementById("play");
playButton.addEventListener("click", () =>  {
    playWord()
})
bricksContainer.addEventListener("drop", (event) => {
    dropHandler(event);
});
bricksContainer.addEventListener("dragover", (event) => {
    dragOverHandler(event);
});
createGameBtn.addEventListener('click', createGame);
/*
joinGameBtn.addEventListener('click', joinGame);
startGameBtn.addEventListener('click', startGame);*/

let pollingInterval;

function startPolling() {
    pollingInterval = setInterval(async () => {
        await fetchGameState();
        
        // If game started, show game screen
        if (currentGameState && currentGameState.game_started && lobbyScreen.style.display !== 'none') {
            showGameScreen();
        }
    }, 2000); // Poll every 2 seconds
}
function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
}