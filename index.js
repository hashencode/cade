import '@babel/polyfill';
import './src/styles/cade.scss';
import './src/scripts/cade.js';
import { Cade } from './src/scripts/cade';

const myCade = new Cade();
myCade.stageInit();
myCade.createBlock({
  x: 200,
  y: 100
});
