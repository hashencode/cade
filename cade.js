class Cade {
  stage;
  // 初始化 Stage
  stageInit() {
    const stageDom = document.querySelector("#cade-content");
    const stageWidth = stageDom.clientWidth;
    const stageHeight = stageDom.clientHeight;
    this.stage = new Konva.Stage({
      container: "cade-content",
      width: stageWidth,
      height: stageHeight
    });
  }
  // 创建矩形
  drawRect() {
    const rectGroup = new Konva.Group({
      x: 0,
      y: 0,
      draggable: true
    });
    const layer = new Konva.Layer();
    // 绘制文字
    const rectText = new Konva.Text({
      x: 0,
      y: 0,
      text: "方形节点",
      width: 170,
      fontSize: 14,
      padding: 15,
      align: "center",
      name: "Part"
    });
    // 绘制矩形
    const rect = new Konva.Rect({
      x: 0,
      y: 0,
      width: 170,
      height: rectText.height(),
      fill: "#e7f7ff",
      stroke: "#5dafff",
      strokeWidth: 1,
      cornerRadius: 4,
      shadowColor: "black",
      shadowBlur: 10,
      shadowOffset: { x: 0, y: 0 },
      shadowOpacity: 0.15
    });
    this.cursorMove(rectText);
    rectGroup.add(rect);
    rectGroup.add(rectText);
    this.drawPoints(rect, rectGroup);
    layer.add(rectGroup);
    this.stage.add(layer);
  }
  // 绘制连接点
  drawPoints(_ctx, _group) {
    const _attr = _ctx.attrs;
    const pointGroup = new Konva.Group();
    const pointRing = new Konva.Ring({
      x: 0,
      y: 0,
      innerRadius: 5,
      outerRadius: 11,
      fill: "#5dafff",
      opacity: 0
    });
    const pointCircle = new Konva.Circle({
      x: 0,
      y: 0,
      radius: 5,
      fill: "white",
      stroke: "#5dafff",
      strokeWidth: 1,
      margin: 10,
      name: "Point"
    });
    pointGroup.add(pointCircle);
    pointGroup.add(pointRing);
    const axisArray = [
      { x: _attr.x, y: _attr.y + _attr.height / 2 },
      { x: _attr.x + _attr.width, y: _attr.y + _attr.height / 2 },
      { x: _attr.x + _attr.width / 2, y: 0 },
      { x: _attr.x + _attr.width / 2, y: _attr.height }
    ];
    for (let i = 0; i < 4; i++) {
      const _clone = pointGroup.clone({
        x: axisArray[i].x,
        y: axisArray[i].y
      });
      _clone.on("mousedown", evt => {
        evt.cancelBubble = true;
      });
      _group.add(_clone);
      this.cursorCrosshair(_clone);
    }
  }
  // 鼠标样式修改
  cursorMove(_ctx) {
    _ctx.on("mouseenter", () => {
      this.stage.container().style.cursor = "move";
    });
    _ctx.on("mouseleave", () => {
      this.stage.container().style.cursor = "default";
    });
  }
  cursorCrosshair(_ctx) {
    _ctx.on("mouseenter", () => {
      this.stage.container().style.cursor = "crosshair";
    });
    _ctx.on("mouseleave", () => {
      this.stage.container().style.cursor = "default";
    });
  }
}

const myCade = new Cade();
myCade.stageInit();
myCade.drawRect();
