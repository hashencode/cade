const strokeColor = '#5dafff',
  fillColor = '#e7f7ff',
  lineColor = '#ababab';
class Cade {
  constructor() {
    this.stage = undefined;
    this.lineDrawing = false;
    this.lineStartPoint = undefined;
    this.lineEndPoint = undefined;
  }

  // 初始化 Stage
  stageInit() {
    const stageDom = document.querySelector('#cade-content');
    const stageWidth = stageDom.clientWidth;
    const stageHeight = stageDom.clientHeight;
    this.stage = new Konva.Stage({
      container: 'cade-content',
      width: stageWidth,
      height: stageHeight
    });
  }

  // 生成唯一ID
  randomID() {
    return Number(
      Math.random()
        .toString()
        .substr(3, 13) + Date.now()
    ).toString(36);
  }

  // 创建块
  drawBlock(config) {
    const layer = new Konva.Layer({
      x: config.x,
      y: config.y,
      draggable: true,
      id: this.randomID()
    });
    const blockGroup = new Konva.Group();
    // 绘制文字
    const blockText = new Konva.Text({
      x: 0,
      y: 0,
      text: '方形节点',
      width: 170,
      fontSize: 14,
      padding: 15,
      align: 'center'
    });
    // 绘制框体
    const rect = new Konva.Rect({
      x: 0,
      y: 0,
      width: 170,
      height: blockText.height(),
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: 1,
      cornerRadius: 4,
      shadowColor: '#cdcdcd',
      shadowBlur: 10,
      shadowOffset: { x: 0, y: 0 },
      shadowOpacity: 0.3
    });
    blockText.on('mouseenter', () => {
      this.stage.container().style.cursor = 'move';
    });
    blockText.on('mouseleave', () => {
      this.stage.container().style.cursor = 'default';
    });
    blockGroup.add(rect);
    blockGroup.add(blockText);
    layer.add(blockGroup);
    layer.add(this.drawPoints(rect));
    this.stage.add(layer);
  }

  // 绘制连接点
  drawPoints(_ctx) {
    // 多个点合集
    const pointsGroup = new Konva.Group({
      name: 'pointsGroup'
    });
    const _attr = _ctx.attrs;
    // 单个点合集
    const pointGroup = new Konva.Group({
      id: this.randomID()
    });
    const pointRing = new Konva.Ring({
      x: 0,
      y: 0,
      innerRadius: 5,
      outerRadius: 11,
      fill: strokeColor,
      opacity: 0,
      name: 'pointRing'
    });
    const pointCircle = new Konva.Circle({
      x: 0,
      y: 0,
      radius: 5,
      fill: 'white',
      stroke: strokeColor,
      strokeWidth: 1,
      name: 'pointCircle'
    });
    // 鼠标移入时填充蓝色，移出时填充白色
    pointCircle.on('mouseenter', evt => {
      // 当前如果是在画线，则不设置监听
      if (this.lineDrawing) return false;
      evt.target.fill(strokeColor);
      evt.currentTarget.parent.draw();
    });
    pointCircle.on('mouseleave', evt => {
      if (this.lineDrawing) return false;
      evt.target.fill('white');
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
      const _pointGroupClone = pointGroup.clone({
        x: axisArray[i].x,
        y: axisArray[i].y,
        id: this.randomID()
      });
      // 鼠标按下时设置对鼠标移动的监听
      _pointGroupClone.on('mousedown', evt => {
        evt.cancelBubble = true;
        // 获取到当前point的中心位置
        this.lineStartPoint = evt.currentTarget;
        this.drawDashLine(evt.currentTarget.absolutePosition());
        this.pointRingVisiableSwitch(true, evt.currentTarget.attrs.id);
      });
      _pointGroupClone.on('mouseenter', evt => {
        if (this.lineDrawing) {
        } else {
          // 用于拖拽的点
          const dropCircle = new Konva.Circle({
            x: 0,
            y: 0,
            radius: 5,
            fill: 'red',
            stroke: strokeColor,
            strokeWidth: 1,
            draggable: true,
            id: 'dropCircle'
          });
          dropCircle.on('dragmove', evt => {});
          _pointGroupClone.add(dropCircle);
        }

        evt.cancelBubble = true;
        if (!this.lineDrawing) return (this.stage.container().style.cursor = 'crosshair');
        // 只有当画线时触发以下操作
        this.lineEndPoint = evt.currentTarget;
      });
      _pointGroupClone.on('mouseleave', evt => {
        evt.cancelBubble = true;
        if (!this.lineDrawing) return (this.stage.container().style.cursor = 'default');
        // 只有当画线时触发以下操作
        console.count();
        // this.lineEndPoint = undefined;
      });
      pointsGroup.add(_pointGroupClone);
    }
    return pointsGroup;
  }

  // point环的显隐
  pointRingVisiableSwitch(visiable, layerID = null) {
    this.stage.find('.pointRing').each(item => {
      if (item.parent.attrs.id != layerID) {
        item.opacity(visiable ? 0.5 : 0);
      }
    });
    this.stage.find('.pointsGroup').each(gItem => {
      gItem.parent.draw();
    });
  }

  // 绘制连线
  drawDashLine(_currentPos) {
    // 为每一条线设置唯一ID
    const lineID = this.randomID();
    this.stage.on('mousemove', moveEvt => {
      this.lineDrawing = true;
      const _pointsArray = [_currentPos.x, _currentPos.y, moveEvt.evt.offsetX, moveEvt.evt.offsetY];
      this.stage.container().style.cursor = 'crosshair';
      const lineByID = this.stage.find(`#${lineID}`);
      if (lineByID.length > 0) {
        lineByID[0].attrs.points = _pointsArray;
        lineByID[0].parent.draw();
      } else {
        const layer = new Konva.Layer();
        const line = new Konva.Line({
          points: _pointsArray,
          stroke: strokeColor,
          lineCap: 'round',
          lineJoin: 'round',
          dash: [5],
          id: lineID
        });
        layer.add(line);
        this.stage.add(layer);
      }
    });

    this.stage.on('mouseup', () => {
      // 鼠标抬起时销毁鼠标移动的监听
      this.stage.off('mousemove mouseup');
      // 取消绘线状态
      this.lineDrawing = false;
      // 设置鼠标样式
      this.stage.container().style.cursor = 'default';
      // 消除pointRing样式
      this.pointRingVisiableSwitch(false);
      this.lineStartPoint.find('.pointCircle')[0].fill('white');
      this.stage.find(`#${lineID}`)[0].destroy();
      if (this.lineEndPoint && this.lineStartPoint.attrs.id !== this.lineEndPoint.attrs.id) {
        this.drawArrowLine();
      }
      this.stage.draw();
    });
  }

  drawArrowLine() {
    const layer = new Konva.Layer();
    const line = new Konva.Arrow({
      points: [
        this.lineStartPoint.absolutePosition().x,
        this.lineStartPoint.absolutePosition().y,
        this.lineEndPoint.absolutePosition().x,
        this.lineEndPoint.absolutePosition().y
      ],
      stroke: lineColor,
      fill: lineColor,
      pointerLength: 8,
      pointerWidth: 5,
      id: this.randomID()
    });
    layer.add(line);
    this.stage.add(layer);
  }
}

export { Cade };
