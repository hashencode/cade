## Cade

cade：一个可视化流程图编辑器，因为目前（2019/04/27）G2的流程图编辑器还不是开源的产品，公司需要自己做一个工作流引擎，所以就用Konvajs自己写了一个。



### 安装

拉取代码安装依赖

```
npm install
```



### 运行

```
npm run serve
```



### 使用

拖动顶部菜单栏的方形、圆形、菱形至舞台，即可创建新元素



### Api

- `myCade.stageInit()`：初始化舞台
- `myCade.onCreateBlock()`：监听块的创建，返回被创建的块
- `myCade.onUpdateBlock()`：监听块的更新
- `myCade.onDestroyBlock()`：监听块的销毁
- `myCade.onCreateArrow()`：监听箭头的更新
- `myCade.onUpdateArrow()`：监听箭头的更新
- `myCade.onDestroyArrow()`：监听箭头的更新
- `myCade.onElementFocus()`：监听元素的聚焦
- `myCade.onElementBlur()`：监听元素的失去焦点

