let storedNumBoards = Number(sessionStorage.getItem("storedNumBoards"));
let numBoards = (storedNumBoards) ? storedNumBoards : 1;
const flipTime = 300;
const keyboard = document.querySelector(".key-container");
const messageDisplay = document.querySelector(".message-container");
const gameContainer = document.querySelector(".game-container")
const inputBar = document.getElementById("input-bar")
const overlay_bg = document.getElementById("overlay-bg")

let isGameOver = false;
let currentIndex = 0;
// keep track of guesses 
const guessRows = [];
const numGuessRows = 5 + numBoards;
for (let i = 0; i < numGuessRows; i++) {
  guessRows.push(["", "", "", "", ""]);
}

// create board container which holds board element and add to boardArr
let currentRow = 0;
let currentTile = 0;
const boardArr = [];
for (let i = 0; i < numBoards; i++) {
    createBoardContainer(i)
    boardArr.push(document.querySelector(`#board-container-${i}`));
}

document.addEventListener("keydown", (event) => {
  let key;
  if (event.key == 'Escape' && inputBar.style.display === "block") {
    hideInputBar();
  }
  if (event.code === "Space") {
    key = "__";
    event.preventDefault()
  } else {
    key = event.key.toUpperCase();
  }
  handleInput(key);
});

// this is good code :')
let allowed_words = WORD_BANK.split(" ")

// declare + initialize list of random words to guess and their respective completion trackers
const wordleArr = [];
const boardIsCompletedArr = [];
// create empty board for each board
for (let i = 0; i < numBoards; i++) {
  boardIsCompletedArr.push(false);
  wordleArr.push(allowed_words[Math.floor(Math.random() * allowed_words.length)].toUpperCase());
  createBoard(boardArr[i], i);
}
wordleArr[0] = 'SUSHI'

// creates key display - only one needed
keys.forEach((key) => {
  const buttonElement = document.createElement("button");
  buttonElement.textContent = key;
  buttonElement.setAttribute("id", key);
  buttonElement.addEventListener("click", () => handleInput(key));
  keyboard.append(buttonElement);
});

function createBoardContainer(index) {
    boardsDisplayContainer = document.querySelector(".boards-display-container");
    const boardContainer = document.createElement("div");
    boardContainer.setAttribute("id", `board-container-${index}`);
    boardContainer.setAttribute("class", `board-container`);
    boardContainer.setAttribute("onclick", `getKeyboardStateByBoard(${index})`)
    boardsDisplayContainer.append(boardContainer);
}

// creates tile display - unique to each display
function createBoard(board, boardIndex) {
  guessRows.forEach((guessRow, guessRowIndex) => {
    const rowElement = document.createElement("div");
    rowElement.setAttribute("id", `d${boardIndex}-guessRow-${guessRowIndex}`);
    rowElement.setAttribute("name", `guessRow-${guessRowIndex}`);
    guessRow.forEach((guess, guessIndex) => {
      const tileElement = document.createElement("div");
      tileElement.setAttribute(
        "id",
        `d${boardIndex}-guessRow-${guessRowIndex}-tile-${guessIndex}`
      );
      tileElement.setAttribute(
        "name",
        `guessRow-${guessRowIndex}-tile-${guessIndex}`
      );
      tileElement.classList.add("tile");
      rowElement.append(tileElement);
    });
    board.append(rowElement);
  });
}

// uses checkGuess, addLetter, deleteLetter
function handleInput(key) {
  if (key == "BACKSPACE") {
    key = "DEL";
  }

  if (isGameOver || !keys.includes(key) || (inputBar.style.display == "block" && key != "ENTER")) {
    return;
  }

  if (key === "DEL") {
    deleteLetter();
    return;
  }

  if (key === "ENTER") {
    if (inputBar.style.display == "block") {
      getBoardNumByInput()
    } else {
      checkGuess();
    }
    return;
  }

  addLetter(key);
}

// same for each display
function addLetter(key) {
  if (currentTile >= 5 || currentRow >= 5 + numBoards) {
    return;
  }
  const tiles = document.getElementsByName(
    `guessRow-${currentRow}-tile-${currentTile}`
  );
  tiles.forEach((tile, index) => {
    if (!boardIsCompletedArr[index]) {
      tile.textContent = key;
      guessRows[currentRow][currentTile] = key;
      tile.setAttribute("data", key);
      tile.classList.add("pop");
      tile.classList.add("grey-border");
    }
  });
  currentTile++;
}

// same for each display
function deleteLetter() {
  if (currentTile <= 0) {
    return;
  }
  currentTile--;
  const tiles = document.getElementsByName(`guessRow-${currentRow}-tile-${currentTile}`);
  tiles.forEach((tile, index) => {
    if (!boardIsCompletedArr[index]) {
      tile.textContent = "";
      guessRows[currentRow][currentTile] = "";
      tile.setAttribute("data", "");
      tile.classList.remove("pop")
      tile.classList.remove("grey-border");
    }
  });
}

// check guess against wordle word
function checkGuess() {
  if (currentTile < 4) {
    return;
  }
  const guess = guessRows[currentRow].join("");
  fetch(`https://wordsapiv1.p.rapidapi.com/words/${guess}`, {
    method: "GET",
    headers: {
      "x-rapidapi-host": "wordsapiv1.p.rapidapi.com",
      "x-rapidapi-key": config.RAPIDAPI_KEY,
    },
  })
    .then((res) => {
      if (!res.ok && !wordleArr.includes(guess)) {
        throw Error();
      }
      flipTile();
      // if any displays are correct, no longer accept input on that display
      wordleArr.forEach((wordle, index) => {
        if (guess == wordle) {
          boardIsCompletedArr[index] = true;
          let jingle = new Audio("kurtingle.mp3");
          jingle.play()
        }
      });
      if (boardIsCompletedArr.every((x) => x)) {
        showMessage("Amazing!", duration=5000);
        let audio = new Audio("NYT.mp3"); // should probably declare up top
        audio.play();
        isGameOver = true;
        return;
      } else {
        if (currentRow >= 5 + numBoards - 1) {
          isGameOver = true;
          showMessage(
            `Game over. You lose. The words were: ${wordleArr.join(" ")}`
          , duration=5000);
          return;
        }
        if (currentRow < 5 + numBoards) {
          currentRow++;
          currentTile = 0;
        }
      }
    })
    .catch(() => {
      showMessage("Word is not recognized.");
    });
}

// only one needed
function showMessage(message, duration=2000) {
  const messageElement = document.createElement("p");
  messageElement.textContent = message;
  messageDisplay.append(messageElement);
  setTimeout(() => messageDisplay.removeChild(messageElement), duration);
}

// same for all displays for now
function addColorToKey(keyLetter, color) {
    const key = document.getElementById(keyLetter);
    key.classList.add(color);
}

function removeColorFromKey(keyLetter, color) {
    const key = document.getElementById(keyLetter);
    key.classList.remove(color)
}
// unique to each display
// for the current row on each board, flip the proper tiles
function flipTile() {
  const rowList = document.getElementsByName(`guessRow-${currentRow}`);
  rowList.forEach((row, index) => {
    // makes sure we don't check completed board
    if (boardIsCompletedArr[index]) {
      return;
    }
    rowTiles = row.childNodes;
    wordle = wordleArr[index];
    checkWordle = wordle;
    const guessArr = [];

    rowTiles.forEach((tile) => {
      guessArr.push({
        letter: tile.getAttribute("data"),
        color: "grey-overlay",
      });
    });

    guessArr.forEach((guess, index) => {
      if (guess.letter == wordle[index]) {
        guess.color = "green-overlay";
        checkWordle = checkWordle.replace(guess.letter, '')
      }
    });
    guessArr.forEach((guess) => {
      if (checkWordle.includes(guess.letter) && guess.color != "green-overlay") {
        guess.color = "yellow-overlay";
        checkWordle = checkWordle.replace(guess.letter, '')
      }
    });

    rowTiles.forEach((tile, index) => {
      setTimeout(() => {
        tile.classList.add("flip");
        tile.classList.add(guessArr[index].color);
      }, flipTime * index);
        setTimeout(() => {
            addColorToKey(guessArr[index].letter, guessArr[index].color);
          }, flipTime * 5);
    });
  });
}

function getKeyboardStateByBoard(index) {
    keyboard.classList.add('pop')
    setTimeout(() => {
        keyboard.classList.remove('pop')
      }, 100);
    // keyboard.classList.remove('pop')
    wordle = wordleArr[index];
    let color;

    // remove colors from all letters
    for (let i = 0; i < currentRow; i++) {
        guessRow = guessRows[i];
        guessRow.forEach(letter => {
            removeColorFromKey(letter, 'grey-overlay')
            removeColorFromKey(letter, 'yellow-overlay')
            removeColorFromKey(letter, 'green-overlay')
        })
    }


    // check all rows with wordle
    for (let i = 0; i < currentRow; i++) {
        guessRow = guessRows[i];
        guessRow.forEach((letter, index) => {
            if (letter == wordle[index]) {
                color = "green-overlay";
            } else if (wordle.includes(letter) && color != "green-overlay") {
                color = "yellow-overlay";
            } else {
                color = "grey-overlay";
            }
            addColorToKey(letter, color);
        });
    }
    currentIndex = index;
}

function getBoardNumByInput() {
  let input = Number(document.getElementById("input").value);
  if (!input || !Number.isInteger(input) || input < 1) {
    alert("Please enter a valid number.")
  } else {
    sessionStorage.setItem("storedNumBoards", input);
    window.location.reload();
  }
}

overlay_bg.addEventListener("click", ()=> {
  document.body.style.overflow = "auto";
  inputBar.style.display = "none"
  gameContainer.style.filter = "none";
  overlay_bg.style.display = "none"
})

function toggleInputBar() {
    if (inputBar.style.display === "none") {
      showInputBar();
    } else {
      hideInputBar();
    }
}

function hideInputBar() {
  document.body.style.overflow = "auto";
  inputBar.style.display = "none"
  overlay_bg.style.display = "none"
  gameContainer.style.filter = "none";
}
function showInputBar() {
  document.body.style.overflow = "hidden";
  inputBar.style.display = "block";
  overlay_bg.style.display = "block";
  gameContainer.style.filter = "blur(15px)";
}



