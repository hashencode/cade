import cornerPoints from './corner-points';
const strokeColor = '#5dafff',
  fillColor = '#e7f7ff',
  lineColor = '#abb7c5';
class Cade {
  constructor() {
    this.stage = null;
    this.lineDrawing = false;
    this.lineStartPoint = null;
    this.lineEndPoint = null;
  }

  // 生成唯一ID
  randomID() {
    return Number(
      Math.random()
        .toString()
        .substr(3, 10) + Date.now()
    ).toString(36);
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

  // 创建块
  drawBlock(config) {
    const blockGroup = new Konva.Group({
      x: config.x,
      y: config.y,
      name: 'blockGroup'
    });
    // 绘制文字
    const blockText = new Konva.Text({
      x: 0,
      y: 0,
      text: '方形节点',
      width: 170,
      fontSize: 14,
      padding: 15,
      align: 'center',
      name: 'blockText'
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
    blockGroup.add(rect);
    blockGroup.add(blockText);
    blockGroup.add(this.drawPoints(rect));
    this.blockLayer.add(blockGroup);
    this.blockLayer.draw();
    this.blockEventBind(blockGroup);
  }

  // 为block绑定事件
  blockEventBind(currentBlock) {
    if (currentBlock) {
      this.blockEvent(currentBlock);
    } else {
      this.blockLayer.find('.blockGroup').each(item => {
        this.blockEvent(item);
      });
    }
  }

  blockEvent(currentBlock) {
    currentBlock.on('dragmove', () => {

    });
    currentBlock.find('.blockText').on('mouseenter', () => {
      this.stage.container().style.cursor = 'move';
    });
    currentBlock.find('.blockText').on('mouseleave', () => {
      this.stage.container().style.cursor = 'default';
    });
  }

  // 绘制连接点
  drawPoints(_ctx) {
    // 多个点合集
    const pointContainer = new Konva.Group({
      name: 'pointContainer'
    });
    const _attr = _ctx.attrs;
    // 单个点合集
    const pointGroup = new Konva.Group({
      name: 'pointGroup'
    });
    const pointCircleRing = new Konva.Ring({
      x: 0,
      y: 0,
      innerRadius: 5,
      outerRadius: 11,
      fill: strokeColor,
      opacity: 0,
      name: 'pointCircleRing'
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
    pointGroup.add(pointCircleRing);
    pointGroup.add(pointCircle);
    // 节点坐标
    const axisArray = [
      { x: _attr.x + _attr.width / 2, y: 0, direction: [0, -1] },
      { x: _attr.x + _attr.width, y: _attr.y + _attr.height / 2, direction: [1, 0] },
      { x: _attr.x + _attr.width / 2, y: _attr.height, direction: [0, 1] },
      { x: _attr.x, y: _attr.y + _attr.height / 2, direction: [-1, 0] }
    ];
    // 将节点插入group
    for (let i = 0; i < 4; i++) {
      const _pointGroupClone = pointGroup.clone({
        x: axisArray[i].x,
        y: axisArray[i].y,
        direction: axisArray[i].direction,
        id: this.randomID()
      });
      this.pointGroupEventBind(_pointGroupClone);
      pointContainer.add(_pointGroupClone);
    }
    return pointContainer;
  }

  // 为pointGroup绑定事件
  pointGroupEventBind(currentPointGroup) {
    if (currentPointGroup) {
      this.pointGroupEvent(currentPointGroup);
    } else {
      this.blockLayer.find('.pointGroup').each(item => {
        this.pointGroupEvent(item);
      });
    }
  }

  pointGroupEvent(_pointGroup) {
    _pointGroup.on('mouseenter', enterEvent => {
      this.lineStartPoint = enterEvent.currentTarget;
      // 判断当前是否处于绘线状态，如果不是，则创建dropCircle，并添加拖拽事件监听
      if (this.lineDrawing) {
      } else {
        const startPointTarget = this.lineStartPoint.absolutePosition();
        let dropCircleGroup = this.stage.findOne('.dropCircleGroup');
        if (dropCircleGroup) {
          dropCircleGroup.destroy();
        }
        dropCircleGroup = new Konva.Group({
          x: startPointTarget.x,
          y: startPointTarget.y,
          draggable: true,
          name: 'dropCircleGroup'
        });
        // 用于拖拽的点
        const dropCircle = new Konva.Circle({
          radius: 5,
          strokeWidth: 1,
          name: 'dropCircle'
        });
        const dropCircleRing = new Konva.Ring({
          innerRadius: 5,
          outerRadius: 11,
          name: 'dropCircleRing'
        });
        dropCircleGroup.on('dragstart', () => {
          this.lineDrawing = true;
          this.stage.container().style.cursor = 'crosshair';
          this.pointCircleRingVisiableSwitch(true);
        });
        dropCircleGroup.on('dragmove', event => {
          const touchShape = this.blockLayer.getIntersection(this.stage.getPointerPosition(), 'Group');
          if (touchShape && touchShape.getAttr('name') === 'pointGroup') {
            this.lineEndPoint = touchShape._id === this.lineStartPoint._id ? null : touchShape;
          } else {
            this.lineEndPoint = null;
          }
          const gropPosition = event.currentTarget.absolutePosition();
          // this.drawDashLine([startPointTarget.x, startPointTarget.y, gropPosition.x, gropPosition.y]);
          this.drawDashLine(gropPosition);
        });
        dropCircleGroup.on('dragend', () => {
          this.lineLayer.findOne('.dropCircleGroup').destroy();
          this.stage.container().style.cursor = 'default';
          this.pointCircleRingVisiableSwitch(false);
          this.lineDrawing = false;
          // 清除虚线
          const lineByName = this.lineLayer.find(`.dashLine`);
          lineByName.each(item => {
            item.destroy();
          });
          this.lineLayer.draw();
          if (this.lineEndPoint) {
            const lineID = this.drawArrowLine();
            // 返回arrow line的id，根据矢量方向，分别设置importLine和exportLine
            const startBlock = this.lineStartPoint.findAncestor('.blockGroup');
            if (startBlock.hasOwnProperty('exportLine')) {
              startBlock.exportLine.push(lineID);
            } else {
              startBlock['exportLine'] = [lineID];
            }
            const endBlock = this.lineEndPoint.findAncestor('.blockGroup');
            if (endBlock.hasOwnProperty('importLine')) {
              endBlock.importLine.push(lineID);
            } else {
              endBlock['importLine'] = [lineID];
            }
          }
        });
        dropCircleGroup.add(dropCircle);
        dropCircleGroup.add(dropCircleRing);
        this.lineLayer.add(dropCircleGroup);
        this.lineLayer.draw();
      }
    });
  }

  // point环的显隐
  pointCircleRingVisiableSwitch(visiable) {
    this.blockLayer.find('.pointContainer').each(pcItem => {
      pcItem.find('.pointCircleRing').each(item => {
        if (item._id !== this.lineStartPoint.findOne('.pointCircleRing')._id) {
          item.opacity(visiable ? 0.5 : 0);
        }
      });
    });
    this.blockLayer.draw();
  }

  // 绘制连线
  drawDashLine(mousePos) {
    const lineByName = this.lineLayer.findOne(`.dashLine`);
    const linePos = this.lineStartPoint.absolutePosition();
    // 对比宽高，设置不同的显示方式
    const _width = Math.abs(mousePos.x - linePos.x),
      _height = Math.abs(mousePos.y - linePos.y);
    let cornerX, cornerY;
    if (_width >= _height) {
      cornerX = mousePos.x - linePos.x >= 0 ? linePos.x + _width : linePos.x - _width;
      cornerY = linePos.y;
    } else {
      cornerX = linePos.x;
      cornerY = mousePos.y - linePos.y >= 0 ? linePos.y + _height : linePos.y - _height;
    }
    // 判断当前是否已经存在虚线，如果存在则更新而不创建
    if (lineByName) {
      lineByName.setAttrs({ points: [linePos.x, linePos.y, cornerX, cornerY, mousePos.x, mousePos.y] });
      lineByName.getParent().draw();
    } else {
      const line = new Konva.Line({
        points: [linePos.x, linePos.y, cornerX, cornerY, mousePos.x, mousePos.y],
        stroke: strokeColor,
        name: 'dashLine',
        dash: [5]
      });
      this.lineLayer.add(line);
    }
  }

  // 绘制箭头线段
  drawArrowLine() {
    const startPos = this.lineStartPoint.absolutePosition(),
      endPos = this.lineEndPoint.absolutePosition();
    const line = new Konva.Arrow({
      points: cornerPoints({
        entryPoint: [startPos.x, startPos.y],
        entryDirection: this.lineStartPoint.attrs.direction,
        exitPoint: [endPos.x, endPos.y],
        exitDirection: this.lineEndPoint.attrs.direction
      }),
      stroke: lineColor,
      fill: lineColor,
      pointerLength: 6,
      pointerWidth: 5,
      startPoint: this.lineStartPoint.getAttr('id'),
      endPoint: this.lineEndPoint.getAttr('id'),
      name: 'arrowLine',
      lineCap: 'round',
      lineJoin: 'round'
    });
    this.lineLayer.add(line);
    this.lineLayer.draw();
  }
}

export { Cade };
