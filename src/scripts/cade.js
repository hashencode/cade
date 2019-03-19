const strokeColor = '#5dafff',fillColor='#e7f7ff';
class Cade {
  // 初始化 Stage
  stageInit() {
    const stageDom = document.querySelector("#cade-content");
    const stageWidth = stageDom.clientWidth;
    const stageHeight = stageDom.clientHeight;
    this["stage"] = new Konva.Stage({
      container: "cade-content",
      width: stageWidth,
      height: stageHeight
    });
  }

  // 生成唯一ID
  randomID(){
    return Number(Math.random().toString().substr(3,13) + Date.now()).toString(36);
  }

  // 创建块
  drawBlock() {
    const rectGroup = new Konva.Group();
    const layer = new Konva.Layer({
      draggable: true,
      id: this.randomID()
    });
    // 绘制文字
    const rectText = new Konva.Text({
      x: 0,
      y: 0,
      text: "方形节点",
      width: 170,
      fontSize: 14,
      padding: 15,
      align: "center",
    });
    // 绘制矩形
    const rect = new Konva.Rect({
      x: 0,
      y: 0,
      width: 170,
      height: rectText.height(),
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: 1,
      cornerRadius: 4,
      shadowColor: "black",
      shadowBlur: 10,
      shadowOffset: { x: 0, y: 0 },
      shadowOpacity: 0.1
    });
    rectText.on("mouseenter", () => {
      this.stage.container().style.cursor = "move";
    });
    rectText.on("mouseleave", () => {
      this.stage.container().style.cursor = "default";
    });
    rectGroup.add(rect);
    rectGroup.add(rectText);
    layer.add(rectGroup);
    layer.add(this.drawPoints(rect));
    this.stage.add(layer);
  }

  // 绘制连接点
  drawPoints(_ctx) {
    // 多个点合集
    const pointsGroup = new Konva.Group();
    const _attr = _ctx.attrs;
    // 单个点合集
    const pointGroup = new Konva.Group();
    const pointRing = new Konva.Ring({
      x: 0,
      y: 0,
      innerRadius: 5,
      outerRadius: 11,
      fill: strokeColor,
      opacity: 0
    });
    const pointCircle = new Konva.Circle({
      x: 0,
      y: 0,
      radius: 5,
      fill: "white",
      stroke: strokeColor,
      strokeWidth: 1,
      margin: 10
    });
    // 鼠标移入时填充蓝色，移出时填充白色
    pointCircle.on("mouseenter", evt => {
      evt.target.fill(strokeColor);
      evt.currentTarget.parent.draw();
    });
    pointCircle.on("mouseleave", evt => {
      evt.target.fill("white");
      evt.currentTarget.parent.draw();
    });
    pointGroup.add(pointRing);
    pointGroup.add(pointCircle);
    // 节点坐标
    const axisArray = [
      { x: _attr.x, y: _attr.y + _attr.height / 2 },
      { x: _attr.x + _attr.width, y: _attr.y + _attr.height / 2 },
      { x: _attr.x + _attr.width / 2, y: 0 },
      { x: _attr.x + _attr.width / 2, y: _attr.height }
    ];
    // 将节点插入group
    for (let i = 0; i < 4; i++) {
      const _pgClone = pointGroup.clone({
        x: axisArray[i].x,
        y: axisArray[i].y,
        id:this.randomID()
      });
      // 鼠标按下时设置对鼠标移动的监听
      _pgClone.on("mousedown", evt => {
        evt.cancelBubble = true;
        // 为每一条线设置唯一ID
        const lineID = this.randomID();
        // 获取到当前point的中心位置
        const currentPointPos = evt.currentTarget.absolutePosition();
        this.stage.on("mousemove", moveEvt => {
          this.drawLine([currentPointPos.x, currentPointPos.y, moveEvt.evt.offsetX, moveEvt.evt.offsetY],lineID);
        });
        // 鼠标抬起时销毁鼠标移动的监听
        this.stage.on('mouseup',upEvt=>{
          this.stage.off('mousemove');
        })
      });
      _pgClone.on("mouseenter", () => {
        this.stage.container().style.cursor = "crosshair";
      });
      _pgClone.on("mouseleave", () => {
        this.stage.container().style.cursor = "default";
      });
      _pgClone.zIndex(4);
      pointsGroup.add(_pgClone);
    }
    return pointsGroup;
  }

  // 绘制连线
  drawLine(_points,_id) {
    const lineByID = this.stage.find(`#${_id}`);
    if (lineByID.length>0) {
      lineByID[0].attrs.points = _points;
      lineByID[0].parent.draw();
    } else {
      const layer = new Konva.Layer();
      const line = new Konva.Line({
        points: _points,
        stroke: strokeColor,
        lineCap: "round",
        lineJoin: "round",
        dash: [5],
        id:_id
      });
      line.zIndex(5);
      layer.add(line);
      this.stage.add(layer);
    }
  }
}

export { Cade };
