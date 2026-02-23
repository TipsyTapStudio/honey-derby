import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';
import { Game } from './game.js';

const canvas = document.getElementById('gameCanvas');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const game = new Game(canvas);

window.addEventListener('keydown', (e) => game.handleKeyDown(e));
window.addEventListener('keyup', (e) => game.handleKeyUp(e));

window._game = game; // expose for debugging
game.start();
