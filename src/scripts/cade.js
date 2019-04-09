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
    this.focusElementID = null;
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

  // 创建 block
  createBlock(config) {
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
    blockElement.add(this.createBlockPoint(rect));
    this.blockLayer.add(blockElement);
    this.blockLayer.draw();
    this.blockEventBind(blockElement);
  }

  // 为 block 绑定事件
  blockEventBind(currentBlock) {
    currentBlock.on('mouseenter', () => {
      this.stage.container().style.cursor = 'move';
    });
    currentBlock.on('mouseleave', () => {
      this.stage.container().style.cursor = 'default';
    });
    currentBlock.on('click', () => {
      this.resetActiveStatus(currentBlock.getAttr('id'));
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

  // 绘制 blockPoint
  createBlockPoint(_ctx) {
    // 多个点合集
    const blockPointElement = new Konva.Group({
      name: 'blockPointElement',
      opacity: 0
    });
    const _attr = _ctx.attrs;
    // 单个点合集
    const blockPointGroup = new Konva.Group({
      name: 'blockPointGroup'
    });
    const blockPointBorder = new Konva.Ring({
      x: 0,
      y: 0,
      innerRadius: 5,
      outerRadius: 11,
      fill: strokeColor,
      opacity: 0,
      name: 'blockPointBorder'
    });
    const blockPointCircle = new Konva.Circle({
      x: 0,
      y: 0,
      radius: 5,
      fill: 'white',
      stroke: strokeColor,
      strokeWidth: 1,
      name: 'blockPointCircle'
    });
    blockPointGroup.add(blockPointBorder);
    blockPointGroup.add(blockPointCircle);
    // 节点坐标
    const axisArray = [
      { x: _attr.x + _attr.width / 2, y: 0, direction: [0, -1] },
      { x: _attr.x + _attr.width, y: _attr.y + _attr.height / 2, direction: [1, 0] },
      { x: _attr.x + _attr.width / 2, y: _attr.height, direction: [0, 1] },
      { x: _attr.x, y: _attr.y + _attr.height / 2, direction: [-1, 0] }
    ];
    // 将节点插入group
    for (let i = 0; i < 4; i++) {
      const _blockPointGroupClone = blockPointGroup.clone({
        x: axisArray[i].x,
        y: axisArray[i].y,
        direction: axisArray[i].direction,
        id: this.randomID()
      });

      blockPointElement.add(_blockPointGroupClone);
    }
    return blockPointElement;
  }

  // 为 blockPoint 绑定事件
  blockPointEventBind(_pointElement) {
    _pointElement.on('mouseenter', enterEvent => {
      this.lineStartPoint = enterEvent.currentTarget;
      // 判断当前是否处于绘线状态，如果不是，则创建dashLineDragPointCircle，并添加拖拽事件监听
      if (!this.lineDrawing) {
        const startPointTarget = this.lineStartPoint.absolutePosition();
        let dashLineDragPointElement = this.stage.findOne('.dashLineDragPointElement');
        if (dashLineDragPointElement) {
          dashLineDragPointElement.destroy();
        }
        dashLineDragPointElement = new Konva.Group({
          x: startPointTarget.x,
          y: startPointTarget.y,
          draggable: true,
          name: 'dashLineDragPointElement'
        });
        // 用于拖拽的点
        const dashLineDragPointCircle = new Konva.Circle({
          radius: 5,
          strokeWidth: 1,
          name: 'dashLineDragPointCircle'
        });
        const dashLineDragPointCircleBorder = new Konva.Ring({
          innerRadius: 5,
          outerRadius: 11,
          name: 'dashLineDragPointCircleBorder'
        });
        dashLineDragPointElement.on('mouseenter', () => {
          this.stage.container().style.cursor = 'crosshair';
        });
        dashLineDragPointElement.on('mouseleave', () => {
          this.stage.container().style.cursor = 'default';
        });
        dashLineDragPointElement.on('dragmove', event => {
          this.lineDrawing = true;
          this.dragPointTouch(event);
        });
        dashLineDragPointElement.on('dragend', async () => {
          this.lineLayer.findOne('.dashLineDragPointElement').destroy();
          await this.dragPointEnd();
        });
        dashLineDragPointElement.add(dashLineDragPointCircle);
        dashLineDragPointElement.add(dashLineDragPointCircleBorder);
        this.lineLayer.add(dashLineDragPointElement);
        this.lineLayer.draw();
      }
    });
  }

  dragPointTouch(event) {
    this.blockPointBorderVisiableSwitch(true);
    // 找到与鼠标当前位置相交的 blockPointGroup，如果相交则设置为 lineEndPoint
    const touchShape = this.stage.getIntersection(this.stage.getPointerPosition(), 'Group');
    if (touchShape && touchShape.getAttr('name') === 'blockPointGroup') {
      this.lineEndPoint = touchShape._id === this.lineStartPoint._id ? null : touchShape;
    } else {
      this.lineEndPoint = null;
    }
    const gropPosition = event.currentTarget.absolutePosition();
    this.createDashLine(gropPosition);
  }

  dragPointEnd() {
    return new Promise((resolve, reject) => {
      this.stage.container().style.cursor = 'default';
      this.blockPointBorderVisiableSwitch(false);
      this.lineDrawing = false;
      // 清除虚线
      this.destoryDashLine();
      if (this.lineEndPoint) {
        const lineID = this.createArrow();
        // 将 arrow 的 id 分别添加入起始 block 和结束 block 的 lines 属性中
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
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  // point 环的显隐
  blockPointBorderVisiableSwitch(visiable) {
    this.blockLayer.find('.blockPointElement').map(fItem => {
      if (!fItem.getAttr('isActive')) {
        fItem.opacity(visiable ? 1 : 0);
        fItem.find('.blockPointBorder').map(cItem => {
          cItem.opacity(visiable ? 0.5 : 0);
        });
      }
    });
    this.blockLayer.draw();
  }

  // 绘制 dashLine
  createDashLine(mousePos) {
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

  // 销毁 dashline
  destoryDashLine() {
    const lineByName = this.lineLayer.find(`.dashLine`);
    lineByName.each(item => {
      item.destroy();
    });
    this.lineLayer.draw();
  }

  // 绘制 arrowLine
  createArrow(_startPointID, _endPointID, _lineID) {
    const _arrowID = _lineID ? _lineID : this.randomID();
    const _arrowStartPoint = _startPointID ? this.blockLayer.findOne(`#${_startPointID}`) : this.lineStartPoint;
    const _arrowEndPoint = _endPointID ? this.blockLayer.findOne(`#${_endPointID}`) : this.lineEndPoint;
    if (_arrowStartPoint && _arrowEndPoint) {
      const startPos = _arrowStartPoint.absolutePosition(),
        endPos = _arrowEndPoint.absolutePosition();
      // 销毁原有的箭头线段
      if (_lineID) {
        this.lineLayer.findOne(`#${_lineID}`).destroy();
      }
      const arrowLineElement = new Konva.Group({
        name: 'arrowLineElement',
        id: _arrowID
      });
      const arrow = new Konva.Arrow({
        points: cornerPoints({
          entryPoint: [startPos.x, startPos.y],
          entryDirection: _arrowStartPoint.getAttr('direction'),
          exitPoint: [endPos.x, endPos.y],
          exitDirection: _arrowEndPoint.getAttr('direction')
        }),
        stroke: lineColor,
        fill: lineColor,
        pointerLength: 6,
        pointerWidth: 5,
        startPoint: _arrowStartPoint.getAttr('id'),
        endPoint: _arrowEndPoint.getAttr('id'),
        name: 'arrowLine',
        lineCap: 'round',
        lineJoin: 'round'
      });
      const arrowDragPoint = new Konva.Circle({
        x: endPos.x,
        y: endPos.y,
        radius: 10,
        name: 'arrowLineDragePoint',
        draggable: true
      });
      arrowLineElement.add(arrow);
      arrowLineElement.add(arrowDragPoint);
      this.lineLayer.add(arrowLineElement);
      this.lineLayer.draw();
      this.arrowEventBind(arrowDragPoint, _arrowID, endPos);
      return _arrowID;
    }
  }

  // 更新 arrow
  updateArrow(arrowID) {
    const _existLine = this.lineLayer.findOne(`#${arrowID}`).findOne('.arrowLine');
    this.createArrow(_existLine.getAttr('startPoint'), _existLine.getAttr('endPoint'), arrowID);
  }

  // arrow 事件绑定
  arrowEventBind(arrowDragPoint, arrowID, endPos) {
    arrowDragPoint.on('mouseenter', () => {
      this.stage.container().style.cursor = 'crosshair';
    });
    arrowDragPoint.on('click', () => {
      this.resetActiveStatus();
    });
    arrowDragPoint.on('dragmove', event => {
      this.dragPointTouch(event);
    });
    arrowDragPoint.on('dragend', async () => {
      const isCreateNewArrow = await this.dragPointEnd();
      if (isCreateNewArrow) {
        this.destoryArrow(arrowID);
      } else {
        arrowDragPoint.x(endPos.x);
        arrowDragPoint.y(endPos.y);
        this.lineLayer.draw();
      }
    });
  }

  // 销毁 arrow
  destoryArrow(arrowID) {
    const _arrowLineElement = this.lineLayer.findOne(`#${arrowID}`);
    const _arrowLine = _arrowLineElement.findOne('.arrowLine');
    ['startPoint', 'endPoint'].map(item => {
      const _ancestor = this.blockLayer.findOne(`#${_arrowLine.getAttr(item)}`).findAncestor('.blockElement');
      const _lines = _ancestor.getAttr('lines');
      _lines.splice(_lines.indexOf(arrowID), 1);
      _ancestor.setAttr('lines', _lines);
    });
    _arrowLineElement.destroy();
    this.lineLayer.draw();
  }

  // 设置激活状态
  resetActiveStatus(arrowID = undefined) {
    this.focusElementID = arrowID;
    this.ActiveStatusFunc(this.stage.findOne(`#${arrowID}`));
    this.stage.draw();
  }

  ActiveStatusFunc(_currentElement) {
    return new Promise(resolve => {
      console.log(_currentElement);
      if (_currentElement) {
        switch (_currentElement.getAttr('name')) {
          case 'blockElement':
            const blockElements = this.blockLayer.find('.blockElement');
            for (let i = 0; i < blockElements.length; i++) {
              const booleanValue = blockElements[i].getAttr('id') === this.focusElementID;
              const _pElement = blockElements[i].findOne('.blockPointElement');
              _pElement.opacity(booleanValue ? 1 : 0);
              _pElement.setAttr('isActive', booleanValue);
              _pElement.find('.blockPointGroup').map(pointItem => {
                if (booleanValue) {
                  this.blockPointEventBind(pointItem);
                } else {
                  pointItem.off('mouseenter');
                }
              });
              if (i >= blockElements.length - 1) {
                resolve();
              }
            }
            break;
          case 'arrowLineElement':
            break;
        }
      } else {
        resolve();
      }
    });
  }
}

export { Cade };
