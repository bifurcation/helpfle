const ROWS = 6;
const COLS = 5;
const CELLS = [];
const BLANK_CLASS = "blank";
const CLASSES = ["not-in-word", "in-word", "in-place"];
const TOO_MANY_WORDS = 1000;

function render(cell) {
  cell.td.innerText = cell.letter;

  // Update the cell's display characteristics
  cell.td.removeAttribute("class");
  if (cell.letter != "") {
    cell.td.classList.add(CLASSES[cell.state]);
  } else {
    cell.td.classList.add(BLANK_CLASS);
  }
}

function renderWords() {
  const words = filterWordList(NYT_WORD_LIST, CELLS);
  const possibilities = document.getElementById("possibilities");
  while (possibilities.firstChild) {
      possibilities.removeChild(possibilities.firstChild);
  }

  if (words.length == 0) {
    const li = document.createElement("li");
    li.innerText = `No words! (Contradiction?)`;
    possibilities.appendChild(li);
  } else if (words.length > TOO_MANY_WORDS) {
    const li = document.createElement("li");
    li.innerText = `Too many words! (${words.length} is too many)`;
    possibilities.appendChild(li);
  } else {
    for (let word of words) {
      const li = document.createElement("li");
      li.innerText = word;
      possibilities.appendChild(li);
    }
  }
}

function shiftFocus(row, col, shift) {
  const next = COLS*row + col + shift;
  if (next > ROWS*COLS || next < 0) {
    return;
  }

  row = Math.floor(next / COLS);
  col = next % COLS;
  CELLS[row][col].td.focus();
}

function update(row, col, e) {
  e.preventDefault();
  const cell = CELLS[row][col];

  console.log(`code: ${e.code}`);

  // If the key is a letter, set the letter and select the next cell
  if (e.code.match("Key([A-Z])")) {
    cell.letter = e.code.match("Key([A-Z])")[1];
    render(cell);
    renderWords();
    shiftFocus(row, col, 1);
  } 
  
  // Backspace clears the selection
  else if (e.code == "Backspace") {
    cell.letter = "";
    cell.state = 0;
    render(cell);
    renderWords();
    shiftFocus(row, col, -1);
  }

  // Left and right arrow keys change active selection
  else if (e.code == "ArrowLeft") {
    shiftFocus(row, col, -1);
  } else if (e.code == "ArrowRight") {
    shiftFocus(row, col, 1);
    
  // Up and down arrow keys change active selection
  } else if (e.code == "ArrowUp") {
    if (cell.letter) {
      cell.state = (cell.state + 1) % CLASSES.length;
    }

    render(cell);
    renderWords();
  } else if (e.code == "ArrowDown") {
    if (cell.letter) {
      cell.state = (cell.state + (CLASSES.length - 1)) % CLASSES.length;
    }

    render(cell);
    renderWords();
  }
  // Any other key clears focus
  else {
    cell.td.blur();
  }
};

function reset() {
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      CELLS[i][j].letter = "";
      CELLS[i][j].state = 0;
      render(CELLS[i][j]);
    }
  }

  renderWords();
  CELLS[0][0].td.focus();
}

function filterWordList(wordList, cells) {
  const grey = cells.flat()
                    .filter(x => x.letter && x.state == 0)
                    .map(x => x.letter)
  const yellow = cells.map(r => r.map((x, i) => [x.letter, i, x.state])
                                 .filter(([letter,pos,state]) => letter && state == 1)
                                 .map(([letter,pos,state]) => [letter, pos]))
                      .flat();
  const green = cells.map(r => r.map((x, i) => [x.letter, i, x.state])
                                 .filter(([letter,pos,state]) => letter && state == 2)
                                 .map(([letter,pos,state]) => [letter, pos]))
                       .flat();

  const inWord = yellow.concat(green)
                       .map(([letter, pos]) => letter)
                       .join("");

  const notInWord = grey.filter(x => !inWord.includes(x));

  return wordList.map(x => x.split(""))
                 .filter(x => !x.some(c => notInWord.indexOf(c) > -1))
                 .filter(x => yellow.every(([l, pos]) => x.includes(l) && x[pos] != l))
                 .filter(x => green.every(([l, pos]) => x[pos] == l))
                 .map(x => x.join(""));
};

var doubleTapped = [];

function doubleTap(i, j) {
  let index = COLS*i + j;
  if(!alreadyTapped[index]) {
    tapedTwice = true;
    setTimeout( function() { tapedTwice = false; }, 300 );
    return false;
  }
  
  event.preventDefault();
  alert("double tap");
}

function load() {
  const guesses = document.getElementById("guesses");
  for (let i = 0; i < ROWS; i++) {
    const tr = document.createElement("tr");
    const cellRow = [];

    for (let j = 0; j < COLS; j++) {
      const td = document.createElement("td");
      
      // Make contenteditable
      td.contentEditable = "true";;

      // Add event handlers
      td.addEventListener("keydown", (e) => update(i, j, e));
      td.addEventListener("touchstart", (e) => doubleTap(i, j));

      tr.appendChild(td);
      cellRow.push({td, letter: "", state: 0});
    }

    guesses.appendChild(tr);
    CELLS.push(cellRow);
  }

  reset();
};

window.addEventListener("load", load);
