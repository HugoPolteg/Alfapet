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
    const bricksContainer = document.getElementById("bricks");
    const newBrick = document.createElement("div");
    newBrick.classList.add("brick");
    newBrick.draggable = true;
    newBrick.id = "Brick" + id;
    let brickCharacter = brickArr[0];
    let brickValue = brickArr[1];
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
                img.src = "downRight.png";
                img.alt = "Down right arrow";
                img.loading = "lazy";
                img.style.width = "2.2vw";
                newBrick.appendChild(img);
                break;
            case "UpRightArrow":
                const img2 = document.createElement("img");
                img2.src = "upRight.png";
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
    ev.dataTransfer.setData("text", ev.target.id);
}

function dragOverHandler(ev) {
    ev.preventDefault();
}

function dropHandler(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    let dragged = document.getElementById(data);
    console.log(ev.target.className)
    console.log(ev.target.nodeName)
    let target = ev.target.className == "" ? ev.target.parentElement : ev.target;
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
    target.appendChild(dragged);
    
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
        let tileType = boardModel[i][x]
        switch(tileType) {
            case "S":
                const img = document.createElement("img");
                img.src = "star.png";
                img.alt = "Star";
                img.loading = "lazy";
                img.style.width = "2.2vw";
                tile.classList.add("redTile");
                tile.appendChild(img);
                break;
            case "G":
                tile.textContent = "3W";
                tile.classList.add("greenTile");
                break;
            case "P":
                tile.textContent = "4W";
                tile.classList.add("purpleTile")
                break;
            case "L":
                tile.textContent = "2L";
                tile.classList.add("lightGreenTile");
                break;
            case "B":
                tile.textContent = "2W";
                tile.classList.add("blueTile");
                break;
            case "X":
                tile.textContent = "4L";
                tile.classList.add("blackTile");
                break;
            case "R":
                tile.textContent = "2L";
                tile.classList.add("redTile");
                break;
            case "O":
                tile.textContent = "3L";
                tile.classList.add("orangeTile");
                break;
            case "D":
                tile.textContent = "2L";
                tile.classList.add("darkGreenTile")
                break;
            case "I":
                tile.textContent = "4L";
                tile.classList.add("pinkTile");
                break;
            case "Y":
                tile.textContent = "2W";
                tile.classList.add("aquaTile")
                break;
            case "N":
                tile.classList.add("normalTile");
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
        boardArray[i].push(tile)
        row.appendChild(tile);
    }
    board.appendChild(row);
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