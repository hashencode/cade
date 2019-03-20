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
    this.blockLayer = new Konva.Layer();
    this.lineLayer = new Konva.Layer();
    this.stage.add(this.blockLayer);
    this.stage.add(this.lineLayer);
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
    const blockGroup = new Konva.Group({
      x: config.x,
      y: config.y,
      draggable: true
    });
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
      shadowOpacity: 0.5
    });
    blockText.on('mouseenter', () => {
      this.stage.container().style.cursor = 'move';
    });
    blockText.on('mouseleave', () => {
      this.stage.container().style.cursor = 'default';
    });
    blockGroup.add(rect);
    blockGroup.add(blockText);
    blockGroup.add(this.drawPoints(rect));
    this.blockLayer.add(blockGroup);
    this.blockLayer.draw();
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
      id: this.randomID(),
      name: 'pointGroup'
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
    pointCircle.on('mouseenter', event => {
      // 当前如果是在画线，则不设置监听
      if (this.lineDrawing) return false;
      event.target.fill(strokeColor);
      event.currentTarget.parent.draw();
    });
    pointCircle.on('mouseleave', event => {
      if (this.lineDrawing) return false;
      event.target.fill('white');
      event.currentTarget.parent.draw();
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
      _pointGroupClone.on('mouseenter', enterEvent => {
        this.lineStartPoint = enterEvent.currentTarget;
        // 判断当前是否处于绘线状态，如果不是，则创建dropCircle，并添加拖拽事件监听
        if (this.lineDrawing) {
        } else {
          const startPointTarget = this.lineStartPoint.absolutePosition();
          let dropCircleGroup = this.stage.find('#dropCircleGroup');
          if (dropCircleGroup.length > 0) {
            dropCircleGroup.each(dcItem => {
              dcItem.destroy();
            });
          }
          dropCircleGroup = new Konva.Group({
            x: startPointTarget.x,
            y: startPointTarget.y,
            draggable: true,
            id: 'dropCircleGroup'
          });
          // 用于拖拽的点
          const dropCircle = new Konva.Circle({
            radius: 5,
            fill: 'red',
            stroke: strokeColor,
            strokeWidth: 1,
            name: 'dropCircle'
          });
          const dropCircleRing = new Konva.Ring({
            innerRadius: 5,
            outerRadius: 11,
            fill: strokeColor,
            opacity: 0,
            name: 'dropCircleRing'
          });
          const lineID = this.randomID();
          dropCircleGroup.on('dragstart', () => {
            this.lineDrawing = true;
            this.pointRingVisiableSwitch(true, enterEvent.currentTarget.attrs.id);
          });
          dropCircleGroup.on('dragmove', event => {
            const gropPosition = event.currentTarget.absolutePosition();
            this.drawDashLine([startPointTarget.x, startPointTarget.y, gropPosition.x, gropPosition.y], lineID);
          });
          dropCircleGroup.on('dragend', () => {
            this.pointRingVisiableSwitch(false, enterEvent.currentTarget.attrs.id);
          });
          dropCircleGroup.add(dropCircle);
          dropCircleGroup.add(dropCircleRing);
          this.lineLayer.add(dropCircleGroup);
          this.lineLayer.on('drop', () => {
            console.log('hi');
          });
          this.lineLayer.draw();
        }
      });
      _pointGroupClone.on('mouseleave', event => {
        event.cancelBubble = true;
      });
      pointsGroup.add(_pointGroupClone);
    }
    return pointsGroup;
  }

  // point环的显隐
  pointRingVisiableSwitch(visiable, layerID = null) {
    this.blockLayer.find('.pointRing').each(item => {
      if (item.parent.attrs.id != layerID) {
        item.opacity(visiable ? 0.5 : 0);
      }
    });
    this.blockLayer.draw();
  }

  // 绘制连线
  drawDashLine(_points, _lineID) {
    const _pointsArray = _points;
    this.stage.container().style.cursor = 'crosshair';
    const lineByID = this.lineLayer.find(`#${_lineID}`);
    if (lineByID.length > 0) {
      lineByID[0].attrs.points = _pointsArray;
      lineByID[0].parent.draw();
    } else {
      const line = new Konva.Line({
        points: _pointsArray,
        stroke: strokeColor,
        lineCap: 'round',
        lineJoin: 'round',
        dash: [5],
        id: _lineID
      });
      this.lineLayer.add(line);
    }

    this.stage.on('mouseup', () => {
      // // 鼠标抬起时销毁鼠标移动的监听
      // this.stage.off('mousemove mouseup');
      // // 取消绘线状态
      // this.lineDrawing = false;
      // // 设置鼠标样式
      // this.stage.container().style.cursor = 'default';
      // // 消除pointRing样式
      // this.pointRingVisiableSwitch(false);
      // this.lineStartPoint.find('.pointCircle')[0].fill('white');
      // this.stage.find(`#${_lineID}`)[0].destroy();
      // if (this.lineEndPoint && this.lineStartPoint.attrs.id !== this.lineEndPoint.attrs.id) {
      //   this.drawArrowLine();
      // }
      // this.stage.draw();
    });
  }

  drawArrowLine() {
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
    this.lineLayer.add(line);
  }
}

export { Cade };
