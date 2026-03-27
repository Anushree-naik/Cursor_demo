(function () {
  'use strict';

  var COLS = 10;
  var ROWS = 20;
  var DROP_MS = 650;
  var LINE_SCORES = [0, 40, 100, 300, 800];

  var COLORS = {
    I: '#7dd3fc',
    O: '#fde047',
    T: '#c084fc',
    S: '#86efac',
    Z: '#fca5a5',
    J: '#93c5fd',
    L: '#fdba74'
  };

  /** [rotation][block] => [row, col] relative to piece origin (x, y) */
  var SHAPES = {
    I: [
      [[0, 0], [0, 1], [0, 2], [0, 3]],
      [[0, 2], [1, 2], [2, 2], [3, 2]],
      [[3, 0], [3, 1], [3, 2], [3, 3]],
      [[0, 1], [1, 1], [2, 1], [3, 1]]
    ],
    O: [
      [[0, 0], [0, 1], [1, 0], [1, 1]],
      [[0, 0], [0, 1], [1, 0], [1, 1]],
      [[0, 0], [0, 1], [1, 0], [1, 1]],
      [[0, 0], [0, 1], [1, 0], [1, 1]]
    ],
    T: [
      [[0, 1], [1, 0], [1, 1], [1, 2]],
      [[0, 1], [1, 1], [1, 2], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 1]],
      [[0, 1], [1, 0], [1, 1], [2, 1]]
    ],
    S: [
      [[0, 1], [0, 2], [1, 0], [1, 1]],
      [[0, 1], [1, 1], [1, 2], [2, 2]],
      [[1, 1], [1, 2], [2, 0], [2, 1]],
      [[0, 0], [1, 0], [1, 1], [2, 1]]
    ],
    Z: [
      [[0, 0], [0, 1], [1, 1], [1, 2]],
      [[0, 2], [1, 1], [1, 2], [2, 1]],
      [[1, 0], [1, 1], [2, 1], [2, 2]],
      [[0, 1], [1, 0], [1, 1], [2, 0]]
    ],
    J: [
      [[0, 0], [1, 0], [1, 1], [1, 2]],
      [[0, 1], [0, 2], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 2]],
      [[0, 1], [1, 1], [2, 0], [2, 1]]
    ],
    L: [
      [[0, 2], [1, 0], [1, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [2, 2]],
      [[1, 0], [1, 1], [1, 2], [2, 0]],
      [[0, 0], [0, 1], [1, 1], [2, 1]]
    ]
  };

  var TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var elScore = document.getElementById('score');
  var elLines = document.getElementById('lines');
  var elStatus = document.getElementById('status');

  var board;
  var current;
  var score;
  var lines;
  var gameOver;
  var dropAcc;
  var lastTs;

  function emptyBoard() {
    var b = [];
    for (var r = 0; r < ROWS; r++) {
      var row = [];
      for (var c = 0; c < COLS; c++) row.push(null);
      b.push(row);
    }
    return b;
  }

  function randomType() {
    return TYPES[(Math.random() * TYPES.length) | 0];
  }

  function blocksFor(type, rot) {
    return SHAPES[type][rot & 3];
  }

  function collides(type, rot, x, y) {
    var blocks = blocksFor(type, rot);
    for (var i = 0; i < blocks.length; i++) {
      var dr = blocks[i][0];
      var dc = blocks[i][1];
      var r = y + dr;
      var c = x + dc;
      if (c < 0 || c >= COLS || r >= ROWS) return true;
      if (r >= 0 && board[r][c]) return true;
    }
    return false;
  }

  function mergePiece() {
    var blocks = blocksFor(current.type, current.rot);
    var color = COLORS[current.type];
    for (var i = 0; i < blocks.length; i++) {
      var r = current.y + blocks[i][0];
      var c = current.x + blocks[i][1];
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) board[r][c] = color;
    }
  }

  function clearLines() {
    var cleared = 0;
    for (var r = ROWS - 1; r >= 0; ) {
      var full = true;
      for (var c = 0; c < COLS; c++) {
        if (!board[r][c]) {
          full = false;
          break;
        }
      }
      if (full) {
        board.splice(r, 1);
        var fresh = [];
        for (var cc = 0; cc < COLS; cc++) fresh.push(null);
        board.unshift(fresh);
        cleared++;
      } else {
        r--;
      }
    }
    if (cleared > 0) {
      lines += cleared;
      score += LINE_SCORES[cleared] || 0;
      elScore.textContent = String(score);
      elLines.textContent = String(lines);
    }
  }

  function spawnPiece() {
    var type = randomType();
    var rot = 0;
    var x = 3;
    var y = 0;
    current = { type: type, rot: rot, x: x, y: y };
    if (collides(type, rot, x, y)) {
      gameOver = true;
      elStatus.hidden = false;
    }
  }

  function tryMove(dx, dy) {
    if (gameOver || !current) return false;
    var nx = current.x + dx;
    var ny = current.y + dy;
    if (collides(current.type, current.rot, nx, ny)) return false;
    current.x = nx;
    current.y = ny;
    return true;
  }

  function tryRotate() {
    if (gameOver || !current) return false;
    var nextRot = (current.rot + 1) & 3;
    var kicks = [0, -1, 1];
    for (var k = 0; k < kicks.length; k++) {
      var dx = kicks[k];
      if (!collides(current.type, nextRot, current.x + dx, current.y)) {
        current.rot = nextRot;
        current.x += dx;
        return true;
      }
    }
    return false;
  }

  function lockAndNext() {
    mergePiece();
    clearLines();
    spawnPiece();
    dropAcc = 0;
  }

  function tickDrop() {
    if (gameOver || !current) return;
    if (!tryMove(0, 1)) lockAndNext();
  }

  function cellSize() {
    var w = canvas.width / COLS;
    var h = canvas.height / ROWS;
    return { w: w, h: h };
  }

  function drawCell(c, r, color, pad) {
    if (pad === undefined) pad = 1;
    var sz = cellSize();
    var x = c * sz.w;
    var y = r * sz.h;
    ctx.fillStyle = color;
    ctx.fillRect(x + pad, y + pad, sz.w - pad * 2, sz.h - pad * 2);
  }

  function drawGrid() {
    var sz = cellSize();
    ctx.strokeStyle = 'rgba(86, 95, 137, 0.35)';
    ctx.lineWidth = 1;
    for (var c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * sz.w + 0.5, 0);
      ctx.lineTo(c * sz.w + 0.5, canvas.height);
      ctx.stroke();
    }
    for (var r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * sz.h + 0.5);
      ctx.lineTo(canvas.width, r * sz.h + 0.5);
      ctx.stroke();
    }
  }

  function draw() {
    ctx.fillStyle = '#16161e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (board[r][c]) drawCell(c, r, board[r][c], 1.5);
      }
    }
    if (current && !gameOver) {
      var blocks = blocksFor(current.type, current.rot);
      var oc = COLORS[current.type];
      for (var i = 0; i < blocks.length; i++) {
        var rr = current.y + blocks[i][0];
        var cc = current.x + blocks[i][1];
        if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) {
          drawCell(cc, rr, oc, 1);
          ctx.strokeStyle = 'rgba(255,255,255,0.25)';
          ctx.lineWidth = 1;
          var sz = cellSize();
          ctx.strokeRect(cc * sz.w + 1, rr * sz.h + 1, sz.w - 2, sz.h - 2);
        }
      }
    }
  }

  function frame(ts) {
    if (lastTs == null) lastTs = ts;
    var dt = ts - lastTs;
    lastTs = ts;
    if (!gameOver && current) {
      dropAcc += dt;
      while (dropAcc >= DROP_MS) {
        dropAcc -= DROP_MS;
        tickDrop();
      }
    }
    draw();
    requestAnimationFrame(frame);
  }

  function reset() {
    board = emptyBoard();
    score = 0;
    lines = 0;
    gameOver = false;
    dropAcc = 0;
    lastTs = null;
    elScore.textContent = '0';
    elLines.textContent = '0';
    elStatus.hidden = true;
    spawnPiece();
  }

  document.addEventListener('keydown', function (e) {
    if (gameOver) return;
    var k = e.key;
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowDown' || k === 'ArrowUp') {
      e.preventDefault();
    }
    if (k === 'ArrowLeft') tryMove(-1, 0);
    else if (k === 'ArrowRight') tryMove(1, 0);
    else if (k === 'ArrowDown') {
      if (!tryMove(0, 1)) lockAndNext();
    } else if (k === 'ArrowUp') tryRotate();
  });

  reset();
  requestAnimationFrame(frame);
})();
