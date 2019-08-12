import '@babel/polyfill';
import './src/styles/cade.scss';
import { Cade } from './src/scripts/cade-g6.js';

const cade = new Cade();
cade.stageInit();
cade.createRect({ x: 100, y: 100 });
cade.createDiamond({ x: 200, y: 200 });
