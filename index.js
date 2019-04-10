import '@babel/polyfill';
import './src/styles/cade.scss';
import './src/scripts/cade.js';
import { Cade } from './src/scripts/cade';
import { cadeFrame } from './src/scripts/cade-frame';

const myCade = new Cade();
myCade.stageInit();
const myCadeFrame = new cadeFrame(myCade);
myCadeFrame.frameInit();
