import '@babel/polyfill';
import './src/styles/cade.scss';
import './src/scripts/cade.js';
import { Cade } from './src/scripts/cade';

const myCade = new Cade();
myCade.stageInit();
myCade.createBlock({
  x: 100,
  y: 100
});
myCade.createBlock({
  x: 400,
  y: 500
});
