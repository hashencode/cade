import './src/styles/cade.scss';
import './src/scripts/cade.js';
import { Cade } from './src/scripts/cade';

const myCade = new Cade();
myCade.stageInit();
myCade.drawBlock({
  x: 100,
  y: 100
});
myCade.drawBlock({
  x: 200,
  y: 200
});
