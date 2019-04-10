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
    this.blockLayer = new Konva.Layer({
      name: 'blockLayer'
    });
    this.lineLayer = new Konva.Layer({
      name: 'lineLayer'
    });
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
    const blockID = this.randomID();
    const blockElement = new Konva.Group({
      x: config ? config.x : 0,
      y: config ? config.y : 0,
      name: 'blockElement',
      isActive: false,
      id: blockID
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
    this.blockEventBind(blockID);
  }

  // 为 block 绑定事件
  blockEventBind(blockID = 0) {
    const currentBlocks = blockID ? this.blockLayer.find(`#${blockID}`) : this.blockLayer.find('.blockElement');
    currentBlocks.map(currentBlockItem => {
      currentBlockItem.on('mouseenter', () => {
        this.stage.container().style.cursor = 'move';
      });
      currentBlockItem.on('mouseleave', () => {
        this.stage.container().style.cursor = 'default';
      });
      currentBlockItem.on('click', () => {
        this.resetActiveStatus(currentBlockItem.getAttr('id'));
      });
      const blockDash = currentBlockItem.findOne('.blockDash');
      // 虚线框事件监听
      blockDash.on('dragmove', () => {
        blockDash.opacity(1);
      });
      blockDash.on('mouseup', () => {
        currentBlockItem.setPosition(blockDash.getAbsolutePosition());
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
    });
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
    return new Promise(resolve => {
      this.stage.container().style.cursor = 'default';
      this.blockPointBorderVisiableSwitch(false);
      this.lineDrawing = false;
      // 清除虚线
      this.destroyDashLine();
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
  destroyDashLine() {
    const lineByName = this.lineLayer.find(`.dashLine`);
    lineByName.each(item => {
      item.destroy();
    });
    this.lineLayer.draw();
  }

  // 绘制 arrowLine
  createArrow(_startPointID, _endPointID, _lineID) {
    const _arrowElementID = _lineID ? _lineID : this.randomID();
    const _arrowStartPoint = _startPointID ? this.blockLayer.findOne(`#${_startPointID}`) : this.lineStartPoint;
    const _arrowEndPoint = _endPointID ? this.blockLayer.findOne(`#${_endPointID}`) : this.lineEndPoint;
    if (_arrowStartPoint && _arrowEndPoint) {
      const startPos = _arrowStartPoint.absolutePosition(),
        endPos = _arrowEndPoint.absolutePosition();
      // 销毁原有的箭头线段
      if (_lineID) {
        this.lineLayer.findOne(`#${_lineID}`).destroy();
      }
      const arrowElement = new Konva.Group({
        name: 'arrowElement',
        id: _arrowElementID
      });
      const arrow = new Konva.Arrow({
        points: cornerPoints({
          entryPoint: [startPos.x, startPos.y],
          entryDirection: _arrowStartPoint.getAttr('direction'),
          exitPoint: [endPos.x, endPos.y],
          exitDirection: _arrowEndPoint.getAttr('direction')
        }),
        stroke: lineColor,
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
        name: 'arrowDragPoint',
        draggable: true
      });
      arrowElement.add(arrow);
      arrowElement.add(arrowDragPoint);
      this.lineLayer.add(arrowElement);
      this.lineLayer.draw();
      this.arrowEventBind(_arrowElementID);
      return _arrowElementID;
    }
  }

  // 更新 arrow
  updateArrow(arrowID) {
    const _existLine = this.lineLayer.findOne(`#${arrowID}`).findOne('.arrowLine');
    this.createArrow(_existLine.getAttr('startPoint'), _existLine.getAttr('endPoint'), arrowID);
  }

  // arrow 事件绑定
  arrowEventBind(arrowID = 0) {
    const arrowElement = arrowID ? this.lineLayer.find(`#${arrowID}`) : this.lineLayer.find('.arrowElement');
    arrowElement.map(arrowElementItem => {
      const arrowDragPoint = arrowElementItem.findOne('.arrowDragPoint');
      const arrowLine = arrowElementItem.findOne('.arrowLine');
      const endPos = arrowLine.getAttr('points').slice(-2);
      arrowLine.on('mouseenter', () => {
        arrowLine.stroke(strokeColor);
        this.lineLayer.draw();
      });
      arrowLine.on('mouseleave', event => {
        const _arrowID = arrowID ? arrowID : event.currentTarget.findAncestor('.arrowElement').id();
        if (this.focusElementID !== _arrowID) {
          arrowLine.stroke(lineColor);
          this.lineLayer.draw();
        }
      });
      arrowLine.on('click', event => {
        this.resetActiveStatus(arrowID ? arrowID : event.currentTarget.findAncestor('.arrowElement').id());
      });
      arrowDragPoint.on('mouseenter', () => {
        this.stage.container().style.cursor = 'crosshair';
      });
      arrowDragPoint.on('dragmove', event => {
        this.dragPointTouch(event);
      });
      arrowDragPoint.on('dragend', async event => {
        const isCreateNewArrow = await this.dragPointEnd();
        if (isCreateNewArrow) {
          this.destroyArrow(arrowID ? arrowID : event.currentTarget.findAncestor('.arrowElement').id());
        } else {
          arrowDragPoint.x(endPos[0]);
          arrowDragPoint.y(endPos[1]);
          this.lineLayer.draw();
        }
      });
    });
  }

  // 销毁 arrow
  destroyArrow(arrowID) {
    const _arrowElement = this.lineLayer.findOne(`#${arrowID}`);
    const _arrowLine = _arrowElement.findOne('.arrowLine');
    ['startPoint', 'endPoint'].map(item => {
      const _ancestor = this.blockLayer.findOne(`#${_arrowLine.getAttr(item)}`).findAncestor('.blockElement');
      const _lines = _ancestor.getAttr('lines');
      _lines.splice(_lines.indexOf(arrowID), 1);
      _ancestor.setAttr('lines', _lines);
    });
    _arrowElement.destroy();
    this.lineLayer.draw();
  }

  // 设置激活状态
  resetActiveStatus(arrowID = undefined) {
    this.focusElementID = arrowID;
    const _currentElement = this.stage.findOne(`#${arrowID}`);
    if (_currentElement) {
      switch (_currentElement.getAttr('name')) {
        case 'blockElement':
          this.resetActiveStatusOfBlock();
          break;
        case 'arrowElement':
          this.resetActiveStatusOfArrow();
          break;
      }
    } else {
      this.resetActiveStatusOfBlock();
      this.resetActiveStatusOfArrow();
    }
    this.stage.draw();
  }

  resetActiveStatusOfBlock() {
    this.blockLayer.find('.blockElement').map(item => {
      const booleanValue = item.getAttr('id') === this.focusElementID;
      const _pElement = item.findOne('.blockPointElement');
      _pElement.opacity(booleanValue ? 1 : 0);
      _pElement.setAttr('isActive', booleanValue);
      _pElement.find('.blockPointGroup').map(pointItem => {
        booleanValue ? this.blockPointEventBind(pointItem) : pointItem.off('mouseenter');
      });
    });
  }

  resetActiveStatusOfArrow() {
    this.lineLayer.find('.arrowElement').map(item => {
      const booleanValue = item.getAttr('id') === this.focusElementID;
      const _arrowLine = item.find('.arrowLine');
      _arrowLine.stroke(booleanValue ? strokeColor : lineColor);
    });
    this.lineLayer.draw();
  }
}

export { Cade };
