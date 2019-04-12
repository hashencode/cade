import '@babel/polyfill';
import './src/styles/cade.scss';
import './src/scripts/cade.js';
import { Cade } from './src/scripts/cade';

const myCade = new Cade();

myCade.stageInit();
myCade.onCreateBlock().subscribe(res => {
  console.log('blockElement Create');
});
myCade.onUpdateBlock().subscribe(res => {
  console.log('blockElement Update');
});
myCade.onCreateArrow().subscribe(res => {
  console.log('arrowElement Create');
});
myCade.onUpdateArrow().subscribe(res => {
  console.log('arrowElement Update');
});
myCade.onElementFocus().subscribe(res => {
  console.log(res);
  document.querySelector('#cade-panel').setAttribute('class', 'active');
});
myCade.onElementBlur().subscribe(res => {
  document.querySelector('#cade-panel').setAttribute('class', '');
});
myCade.createBlock({
  x: 200,
  y: 100,
  type: 'rect'
});
