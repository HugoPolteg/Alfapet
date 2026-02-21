let gameId = null;
let playerId = null;
let playerName = null;
let currentGameState = null;
let draggedTile = null;
let currentPlayerID = null;
let currentPlayerName = null;
let selectedTiles = []
let hand = []
let currentPos = []
let currentBoard = []
const bricksContainer = document.getElementById("bricks");
const lobbyScreen = document.getElementById('lobby');
const gameScreen = document.getElementById('game');
const createGameBtn = document.getElementById('create-game-btn');
const joinGameBtn = document.getElementById('join-game-btn');
const startGameBtn = document.getElementById('start-game-btn');
const socket = io()
function shuffle(array) {
  let currentIndex = array.length;

  while (currentIndex != 0) {

    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}

function addBrick(brickCharacter, brickValue, id, parent) {
    if (document.getElementById(id)) {
        target = document.getElementById(id);
        return target
    }
    const newBrick = document.createElement("div");
    newBrick.classList.add("brick");
    newBrick.draggable = true;
    newBrick.dataset.letter = brickCharacter
    newBrick.dataset.value = brickValue
    newBrick.id = id;
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
    parent.appendChild(newBrick);
    return newBrick
}

function returnBricks(hand) {
    for(const brickId of hand) {
        const brick = document.getElementById(brickId);
        const bricksContainer = document.getElementById("bricks");
        bricksContainer.appendChild(brick)
    }
    selectedTiles = []
    hand = []
    loadBoard(currentBoard, currentPos)
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
    if(target.id == "passframe") {
        selectedTiles.push({
            "id" : tileId, "pass" : true
        })
    } else if(target.id != "bricks") {
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
        selectedTiles.push({'id': tileId, 'row' : row, "col" : col, "pass" : false,
            "letter" : draggedTile['letter'], "value": draggedTile['value']})
    }
    draggedTile = null
    


    target.appendChild(dragged);
    if (target.classList.contains("blackTile") || target.classList.contains("darkGreenTile")) {
        target.style.color = "black"
    }
    console.log(selectedTiles)
}



const board = document.getElementById("board")
function loadBoard(boardModel, placedTiles) {
    boardDimensions = [boardModel.length, boardModel[0].length]
    boardArray = []
    board.replaceChildren()
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
            let placedTile = placedTiles[i][x]
            if(!placedTile) {
                switch(tileType) {
                    //If no tile has been placed here
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
            } else {
                //if a tile has been placed here
                switch(tileType) {
                    //If no tile has been placed here
                    case "S":
                        tile.classList.add("redTile");
                        break;
                    case "N":
                        tile.classList.add("normalTile");
                        break;
                    case "L":
                        tile.classList.add("lightGreenTile");
                        break;
                    case "R":
                        tile.classList.add("redTile");
                        break;
                    case "D":
                        tile.classList.add("darkGreenTile")
                        break;
                    case "O":
                        tile.classList.add("orangeTile");
                        break;
                    case "I":
                        tile.classList.add("pinkTile");
                        break;
                    case "X":
                        tile.classList.add("blackTile");
                        break;
                    case "B":
                        tile.classList.add("blueTile");
                        break;
                    case "Y":
                        tile.classList.add("aquaTile")
                        break;
                    case "G":
                        tile.classList.add("greenTile");
                        break;
                    case "P":
                        tile.classList.add("purpleTile")
                        break;
                }
                brick = addBrick(placedTile.letter, placedTile.value, placedTile.id, tile)
                tile.appendChild(brick);
                if (tile.classList.contains("blackTile") || tile.classList.contains("darkGreenTile")) {
                    tile.style.color = "black";
                }
                brick.draggable = false
            }
            boardArray[i].push(tile);
            row.appendChild(tile);
        }
        board.appendChild(row);
    }
}


function showLobby() {
    gameScreen.style.display = 'none';
    lobbyScreen.style.display = 'block';
    document.querySelector('.lobby-options').style.display = 'block';
    document.getElementById('waiting-room').style.display = 'none';
}

function showWaitingRoom() {
    document.querySelector('.lobby-options').style.display = 'none';
    document.getElementById('waiting-room').style.display = 'block';
    document.getElementById('waiting-game-id').textContent = gameId;
}

function showGameScreen() {
    
    lobbyScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
    document.getElementById('current-player-display').textContent = `Nu spelar: ${currentPlayerName}`
    document.getElementById('game-id-display').textContent = `Spel ID: ${gameId}`;
    document.getElementById('player-name-display').textContent = `Spelare: ${playerName}`;
}

function updateScoreBoard(scoreBoard) {
    const scoreBoardContainer = document.getElementById('score-board')
    scoreBoardContainer.replaceChildren()
    title = document.createElement("h2")
    title.textContent = "Poänglista"
    scoreBoardContainer.appendChild(title)
    scoreBoard.forEach((player) => {
        score = document.createElement("p")
        score.textContent = `${player[1]} - ${player[0]}`
        scoreBoardContainer.appendChild(score)
    })
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
const passButton = document.getElementById("pass");
const passFrame = document.getElementById("passframe");
bricksContainer.addEventListener("drop", (event) => {
    dropHandler(event);
});
bricksContainer.addEventListener("dragover", (event) => {
    dragOverHandler(event);
});
passFrame.addEventListener("drop", (event) => {
    dropHandler(event);
});
passFrame.addEventListener("dragover", (event) => {
    dragOverHandler(event);
});

createGameBtn.addEventListener('click', () => {
    playerName = document.getElementById('create-player-name').value || 'Player 1';
    socket.emit("create", {
        player_name : playerName
    }, (response) => {
        if (response.ok) {
            gameId = response.gameId
            playerId = response.playerId
            showWaitingRoom()
        }

    });
});

joinGameBtn.addEventListener('click', () => {
    const joinGameId = document.getElementById('join-game-id').value;
    playerName = document.getElementById('join-player-name').value || 'Player 2';
    socket.emit("join", {
        player_name : playerName,
        join_id : joinGameId
    }, (response) => {
        if (response.ok) {
            gameId = response.gameId
            playerId = response.playerId
            showWaitingRoom()
        }
    }
    );
});

startGameBtn.addEventListener('click', () => {
    socket.emit("start", (response) => {
        if(!response.ok) {
            showLobby()
        }
    });
});

playButton.addEventListener("click", () =>  {
    socket.emit("play_word", {
        "selectedTiles" : selectedTiles.filter(tile => !tile["pass"])
    }, (response) => {
        if(response.ok) {
            if(!response.valid) {
                alert(response.reason)
            } else {
                alert(response.msg)
                selectedTiles = []                
                response.hand.forEach(brick => {
                    addBrick(brick['letter'], brick['value'], brick['id'], bricksContainer)
                    hand.push(brick['id'])
                });
                returnBricks(hand)

            }
        }
    })
})

passButton.addEventListener("click", () => {
    passTiles = selectedTiles.filter(tile => tile["pass"])
    socket.emit("pass_turn", {
        "selectedTiles" : passTiles
    }, (response) => {
        if(response.ok) {
            if(!response.valid) {
                alert(response.reason)
            } else {
                passTiles.forEach(tile => {
                    let brick = document.getElementById(tile['id']);
                    brick.remove();
                })
                selectedTiles = []
                hand = []                
                response.hand.forEach(brick => {
                    addBrick(brick['letter'], brick['value'], brick['id'], bricksContainer)
                    hand.push(brick['id'])
                });
                console.log("Return", hand)
                
            }
        }
    })
})

socket.on("start", (start) => {
    currentBoard = start.board
    currentPos = start.brickPositions
    currentPlayerID = start.currentPlayerID
    loadBoard(currentBoard, currentPos)
    currentPlayerName = start.currentPlayerName
    start.hand.forEach(brick => {
        addBrick(brick['letter'], brick['value'], brick['id'], bricksContainer)
        hand.push(brick['id'])
    });
    showGameScreen()
})

socket.on("update", (update) => {
    currentPlayerName = update.currentPlayerName
    currentPos = update.brickPositions
    currentPlayerID = update.currentPlayerID
    updateScoreBoard(update.scoreBoard)
    document.getElementById('current-player-display').textContent = `Nu spelar: ${currentPlayerName}`
    returnBricks(hand);
    loadBoard(currentBoard, currentPos)
})
socket.on("game_end", (end) => {
    updateScoreBoard(end.scoreBoard)
    alert(end.scoreBoard)
    showLobby();

})