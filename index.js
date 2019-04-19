import '@babel/polyfill';
import './src/styles/cade.scss';
import './src/scripts/cade.js';
import { Cade } from './src/scripts/cade';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
import Vue from 'vue';

Vue.use(Antd);

// const myCade = new Cade();
//
// myCade.stageInit();
// myCade.onCreateBlock().subscribe(res => {
//   console.log(res);
//   console.log('blockElement Create');
//   res.changeText('你好');
// });
// myCade.onUpdateBlock().subscribe(res => {
//   console.log('blockElement Update');
// });
// myCade.onDestroyBlock().subscribe(res => {
//   console.log('blockElement Destroy');
// });
// myCade.onCreateArrow().subscribe(res => {
//   console.log('arrowElement Create');
// });
// myCade.onUpdateArrow().subscribe(res => {
//   console.log('arrowElement Update');
// });
// myCade.onDestroyArrow().subscribe(res => {
//   console.log('arrowElement Destroy');
// });
// myCade.onElementFocus().subscribe(res => {
//   console.log('focus');
// });
// myCade.onElementBlur().subscribe(res => {
//   console.log('blur');
// });

// vue操作
new Vue({
  el: '.cade-panel',
  data: {
    cadeInstance: new Cade(),
    panelType: 'stage',
    form: {
      place_id: '',
      place_name: '',
      place_desc: ''
    }
  },
  mounted: function() {
    this.cadeInstance.stageInit();
    this.cadeInstance.onElementFocus().subscribe(res => {
      console.log(res);
      this.formInit(res);
      this.form['place_id'] = res.getAttr('id');
    });
  },
  methods: {
    formInit: function() {
      // switch (element) {
      // }
    },
    updateText: function(event) {
      const fID = this.cadeInstance.focusElementID;
      if (fID) {
        this.cadeInstance.stage.findOne(`#${fID}`).changeText(event.target.value);
      }
    }
  }
});
