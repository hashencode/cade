import cornerPoints from './corner-points';
import ResizeObserver from 'resize-observer-polyfill';
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
    this.stage = new Konva.Stage({
      container: 'cade-content',
      width: stageDom.clientWidth,
      height: stageDom.clientHeight
    });
    this.blockLayer = new Konva.Layer();
    this.lineLayer = new Konva.Layer();
    this.stage.add(this.blockLayer);
    this.stage.add(this.lineLayer);
    this.stageEventBind();
    const ro = new ResizeObserver(() => {
      this.stage.setAttrs({
        width: stageDom.clientWidth,
        height: stageDom.clientHeight
      });
      this.stage.draw();
    });
    ro.observe(document.body);
  }

  stageEventBind() {
    // 判断当前点击是否是在空白区域，如果是，则清除所有选中状态
    this.stage.on('mousedown', e => {
      if (e.currentTarget == e.target) {
        this.resetActiveStatus();
      }
    });
  }

  // 创建块
  drawBlock(config) {
    const blockElement = new Konva.Group({
      x: config.x,
      y: config.y,
      name: 'blockElement',
      isActive: false,
      id: this.randomID()
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
    // 绘制拖动虚线框
    const rectDash = new Konva.Rect({
      x: 0,
      y: 0,
      width: 170,
      height: blockText.height(),
      stroke: strokeColor,
      strokeWidth: 1,
      cornerRadius: 4,
      dash: [5],
      draggable: true,
      opacity: 0,
      name: 'blockDash'
    });
    blockElement.add(rect);
    blockElement.add(blockText);
    blockElement.add(rectDash);
    blockElement.add(this.drawPoints(rect));
    this.blockLayer.add(blockElement);
    this.blockLayer.draw();
    this.blockEventBind(blockElement);
  }

  // 为block绑定事件
  blockEventBind(currentBlock) {
    currentBlock.on('mouseenter', () => {
      this.stage.container().style.cursor = 'move';
    });
    currentBlock.on('mouseleave', () => {
      this.stage.container().style.cursor = 'default';
    });
    currentBlock.on('mousedown', () => {
      this.setActiveStatus(currentBlock.getAttr('id'));
    });
    const blockDash = currentBlock.findOne('.blockDash');
    // 虚线框事件监听
    blockDash.on('dragmove', () => {
      blockDash.opacity(1);
    });
    blockDash.on('mouseup', () => {
      currentBlock.setPosition(blockDash.getAbsolutePosition());
      blockDash.opacity(0);
      blockDash.x(0);
      blockDash.y(0);
      this.blockLayer.draw();
      const _lines = blockDash.findAncestor('.blockElement').getAttr('lines');
      if (_lines && _lines.length > 0) {
        _lines.map(item => {
          this.updateArrow(item);
        });
      }
    });
    this.blockLayer.draw();
  }

  // 绘制连接点
  drawPoints(_ctx) {
    // 多个点合集
    const pointsElement = new Konva.Group({
      name: 'pointsElement',
      opacity: 0
    });
    const _attr = _ctx.attrs;
    // 单个点合集
    const pointGroup = new Konva.Group({
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
    pointGroup.add(pointRing);
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

      pointsElement.add(_pointGroupClone);
    }
    return pointsElement;
  }

  // 为pointElement绑定事件
  pointElementEventBind(_pointElement) {
    _pointElement.on('mouseenter', enterEvent => {
      this.lineStartPoint = enterEvent.currentTarget;
      // 判断当前是否处于绘线状态，如果不是，则创建dropPoint，并添加拖拽事件监听
      if (!this.lineDrawing) {
        const startPointTarget = this.lineStartPoint.absolutePosition();
        let dropPointElement = this.stage.findOne('.dropPointElement');
        if (dropPointElement) {
          dropPointElement.destroy();
        }
        dropPointElement = new Konva.Group({
          x: startPointTarget.x,
          y: startPointTarget.y,
          draggable: true,
          name: 'dropPointElement'
        });
        // 用于拖拽的点
        const dropPoint = new Konva.Circle({
          radius: 5,
          strokeWidth: 1,
          name: 'dropPoint'
        });
        const dropPointRing = new Konva.Ring({
          innerRadius: 5,
          outerRadius: 11,
          name: 'dropPointRing'
        });
        dropPointElement.on('dragstart', () => {
          this.lineDrawing = true;
          this.stage.container().style.cursor = 'crosshair';
          this.pointRingVisiableSwitch(true);
        });
        dropPointElement.on('dragmove', event => {
          const touchShape = this.blockLayer.getIntersection(this.stage.getPointerPosition(), 'Group');
          if (touchShape && touchShape.getAttr('name') === 'pointGroup') {
            this.lineEndPoint = touchShape._id === this.lineStartPoint._id ? null : touchShape;
          } else {
            this.lineEndPoint = null;
          }
          const gropPosition = event.currentTarget.absolutePosition();
          this.drawDashLine(gropPosition);
        });
        dropPointElement.on('dragend', () => {
          this.lineLayer.findOne('.dropPointElement').destroy();
          this.stage.container().style.cursor = 'default';
          this.pointRingVisiableSwitch(false);
          this.lineDrawing = false;
          // 清除虚线
          const lineByName = this.lineLayer.find(`.dashLine`);
          lineByName.each(item => {
            item.destroy();
          });
          this.lineLayer.draw();
          if (this.lineEndPoint) {
            const lineID = this.drawArrow();
            // 返回arrow line的id，根据矢量方向，分别设置importLine和exportLine
            const startBlock = this.lineStartPoint.findAncestor('.blockElement'),
              endBlock = this.lineEndPoint.findAncestor('.blockElement');
            [startBlock, endBlock].map(item => {
              if (!item.attrs.hasOwnProperty('lines')) {
                item.setAttr('lines', []);
              }
              if (item.getAttr('lines').indexOf(lineID) < 0) {
                const _linesArray = item.getAttr('lines');
                _linesArray.push(lineID);
                item.setAttr('lines', _linesArray);
              }
            });
          }
        });
        dropPointElement.add(dropPoint);
        dropPointElement.add(dropPointRing);
        this.lineLayer.add(dropPointElement);
        this.lineLayer.draw();
      }
    });
  }

  // point环的显隐
  pointRingVisiableSwitch(visiable) {
    this.blockLayer.find('.pointsElement').map(fItem => {
      if (!fItem.getAttr('isActive')) {
        fItem.opacity(visiable ? 1 : 0);
        fItem.find('.pointRing').map(cItem => {
          cItem.opacity(visiable ? 0.5 : 0);
        });
      }
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
  drawArrow(_startPointID, _endPointID, _lineID) {
    const _id = _lineID ? _lineID : this.randomID();
    const _lineStartPoint = _startPointID ? this.blockLayer.findOne(`#${_startPointID}`) : this.lineStartPoint;
    const _lineEndPoint = _endPointID ? this.blockLayer.findOne(`#${_endPointID}`) : this.lineEndPoint;
    const startPos = _lineStartPoint.absolutePosition(),
      endPos = _lineEndPoint.absolutePosition();
    // 销毁原有的箭头线段
    if (_lineID) {
      this.lineLayer.findOne(`#${_lineID}`).destroy();
    }
    const line = new Konva.Arrow({
      points: cornerPoints({
        entryPoint: [startPos.x, startPos.y],
        entryDirection: _lineStartPoint.getAttr('direction'),
        exitPoint: [endPos.x, endPos.y],
        exitDirection: _lineEndPoint.getAttr('direction')
      }),
      stroke: lineColor,
      fill: lineColor,
      pointerLength: 6,
      pointerWidth: 5,
      startPoint: _lineStartPoint.getAttr('id'),
      endPoint: _lineEndPoint.getAttr('id'),
      name: 'arrowLine',
      lineCap: 'round',
      lineJoin: 'round',
      id: _id
    });
    this.lineLayer.add(line);
    this.lineLayer.draw();
    return _id;
  }

  updateArrow(lineID) {
    const _existLine = this.lineLayer.findOne(`#${lineID}`);
    this.drawArrow(_existLine.getAttr('startPoint'), _existLine.getAttr('endPoint'), lineID);
  }

  arrowEventBind() {}

  // 设置激活状态
  setActiveStatus(currentID) {
    const currentElement = this.stage.findOne(`#${currentID}`);
    switch (currentElement.getAttr('name')) {
      case 'blockElement':
        // 设置block的激活状态
        this.blockLayer.find('.blockElement').map(item => {
          const booleanValue = item.getAttr('id') === currentID;
          const _pElement = item.findOne('.pointsElement');
          _pElement.opacity(booleanValue ? 1 : 0);
          _pElement.setAttr('isActive', booleanValue);
          _pElement.find('.pointGroup').map(pointItem => {
            if (booleanValue) {
              this.pointElementEventBind(pointItem);
            } else {
              pointItem.off('mouseenter');
            }
          });
        });
        break;
    }
  }

  resetActiveStatus() {
    this.blockLayer.find('.pointsElement').map(_pElement => {
      _pElement.opacity(0);
      _pElement.setAttr('isActive', false);
      _pElement.find('.pointGroup').map(pointItem => {
        pointItem.off('mouseenter');
      });
    });
    this.stage.draw();
  }
}

export { Cade };
