## Cade

一个可视化流程图编辑器，因为目前（2019/04/27）G2的流程图编辑器还不是开源的产品，公司需要自己做一个工作流引擎，所以就用Konvajs自己写了一个。



## Demo

[https://hashencode.github.io/cade/dist/](https://hashencode.github.io/cade/dist/)



## Installing

克隆项目后安装依赖

```
npm install
npm run start
```



## Example

示例部分使用 vue 编写

```javascript
import { Cade } from "./src/scripts/cade";
import Vue from "vue";

Vue.use(Antd);

new Vue({
  el: ".cade-panel",
  data: {
    cadeInstance: new Cade(),
  },
  mounted: function() {
    // 舞台初始化
    this.cadeInstance.stageInit();
    // 监听失去焦点事件
    this.cadeInstance.onElementBlur().subscribe(res => {
				// do something
    });
  }
})
```



## API

##### cade.stageInit()

```
// 初始化舞台
cade.stageInit();
```

##### cade.stageImport()

```
// 导入舞台数据，并设置事件监听
const _stageData = otherStage.toJSON();
cade.stageImport(_stageData);
```

##### cade.onCreateBlock()

```
// 监听块的创建，返回被创建的块
cade.onCreateBlock(res=>{
	console.log(res)
})
```

##### cade.onUpdateBlock()

```
// 监听块的更新，返回被更新的块
cade.onUpdateBlock(res=>{
	console.log(res)
})
```

##### cade.onDestroyBlock()

```
// 监听块的销毁，返回被销毁的块
cade.onDestroyBlock(res=>{
	console.log(res)
})
```

##### cade.onCreateArrow()

```
// 监听箭头的创建，返回被创建的箭头
cade.onCreateArrow(res=>{
	console.log(res)
})
```

##### cade.onUpdateArrow()

```
// 监听箭头的更新，返回被更新的箭头
cade.onUpdateArrow(res=>{
	console.log(res)
})
```

##### cade.onDestroyArrow()

```
// 监听箭头的销毁，返回被销毁的箭头
cade.onDestroyArrow(res=>{
	console.log(res)
})
```

##### cade.onElementFocus()

```
// 监听元素的聚焦，返回被聚焦的元素
cade.onElementFocus(res=>{
	console.log(res)
})
```

##### cade.onElementBlur()

```
// 监听元素的失去焦点，返回失去焦点的元素
cade.onElementBlur(res=>{
	console.log(res)
})
```



