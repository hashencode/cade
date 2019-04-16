import cornerPoints from './corner-points';
import ResizeObserver from 'resize-observer-polyfill';
import { Observable } from 'rxjs';
import { cloneDeep } from 'lodash';
import * as localforage from 'localforage';

const primaryStroke = '#5dafff',
  primaryFill = '#e7f7ff',
  warningStroke = '#ffc576',
  warningFill = '#fef7e7',
  lineColor = '#abb7c5';
class Cade {
  constructor() {
    this.stage = null;
    this.lineDrawing = false;
    this.lineStartPoint = null;
    this.lineEndPoint = null;
    this.focusElementID = null; // 当前选择 element id
    this.createBlockObserve = null; // block 创建监听
    this.updateBlockObserve = null; // block 更新监听
    this.createArrowObserve = null; // arrow 创建监听
    this.updateArrowObserve = null; // arrow 更新监听
    this.elementFocusObserve = null; // element激活监听
    this.elementBlurObserve = null; // element释放监听
    this.historyArray = [];
    this.historyIndex = -1;
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
    this.frameInit();
  }

  stageEventBind() {
    // 判断当前点击是否是在空白区域，如果是，则清除所有选中状态
    this.stage.on('mousedown', e => {
      if (e.currentTarget == e.target) {
        this.resetActiveStatus();
      }
    });
  }

  stageClear() {
    this.stage.children.map(layerItem => {
      this[layerItem.attrs.name].destroyChildren();
    });
    this.stage.draw();
  }

  stageImport(_data) {
    this.stageClear();
    if (_data) {
      this.stage = Konva.Node.create(_data, 'cade-content');
    }
    this.stage.children.map(layerItem => {
      this[layerItem.attrs.name] = layerItem;
    });
    this.stage.draw();
    this.stageEventBind();
    this.blockEventBind();
    this.arrowEventBind();
    this.resetActiveStatus();
  }

  // block 创建观察
  onCreateBlock() {
    return Observable.create(observer => {
      this.createBlockObserve = observer;
    });
  }

  // block 更新观察
  onUpdateBlock() {
    return Observable.create(observer => {
      this.updateBlockObserve = observer;
    });
  }

  // 创建 block
  createBlock(config) {
    const blockID = this.randomID();
    const commonBlockConfig = {
      x: 0,
      y: 0,
      shadowColor: '#cdcdcd',
      shadowBlur: 10,
      shadowOffset: { x: 0, y: 0 },
      shadowOpacity: 0.5
    };
    const commonBlockDashConfig = {
      x: 0,
      y: 0,
      strokeWidth: 1,
      dash: [5],
      draggable: true,
      opacity: 0,
      name: 'blockDash'
    };
    let block,
      blockDash,
      elementConfig,
      groupConfig,
      blockDashConfig,
      blockTextConfig = {};
    // 绘制框体
    switch (config.type) {
      // 如果是矩形
      case 'rect':
        elementConfig = Object.assign(
          {
            width: 170,
            height: 40,
            fill: primaryFill,
            stroke: primaryStroke,
            strokeWidth: 1,
            cornerRadius: 4
          },
          commonBlockConfig
        );
        groupConfig = { x: config ? config.x - elementConfig.width / 2 : 0, y: config ? config.y - elementConfig.height / 2 : 0 };
        blockDashConfig = { width: elementConfig.width, height: elementConfig.height, stroke: primaryStroke, cornerRadius: 4 };
        // 绘制 block
        block = new Konva.Rect(elementConfig);
        // 绘制拖动虚线框
        blockDash = new Konva.Rect(Object.assign(commonBlockDashConfig, blockDashConfig));
        break;
      // 如果是圆形
      case 'circle':
        elementConfig = Object.assign(
          {
            width: 80,
            height: 80,
            fill: warningFill,
            stroke: warningStroke,
            strokeWidth: 1
          },
          commonBlockConfig
        );
        groupConfig = { x: config ? config.x : 0, y: config ? config.y : 0 };
        blockDashConfig = {
          radius: elementConfig.width / 2,
          stroke: primaryStroke
        };
        blockTextConfig = { x: -elementConfig.width / 2, y: -elementConfig.height / 2 };
        // 绘制 block
        block = new Konva.Circle(elementConfig);
        // 绘制拖动虚线框
        blockDash = new Konva.Circle(Object.assign(commonBlockDashConfig, blockDashConfig));
        break;
    }
    const blockElement = new Konva.Group({
      x: groupConfig.x,
      y: groupConfig.y,
      name: 'blockElement',
      id: blockID
    });
    // 绘制文字
    const blockText = new Konva.Text(
      Object.assign(
        {
          x: 0,
          y: 0,
          text: '1',
          width: elementConfig.width,
          height: elementConfig.height,
          fontSize: 14,
          verticalAlign: 'middle',
          align: 'center',
          name: 'blockText'
        },
        blockTextConfig
      )
    );
    blockElement.add(block);
    blockElement.add(blockText);
    blockElement.add(blockDash);
    blockElement.add(this.createBlockPoint(block));
    this.blockLayer.add(blockElement);
    this.blockLayer.draw();
    this.blockEventBind(blockID);
    // blockElement 创建反馈
    this.dbCreate();
    this.createBlockObserve.next(blockElement);
  }

  destroyBlock(blockID) {
    const blockElement = this.blockLayer.findOne(`#${blockID}`);
    const lines = cloneDeep(blockElement.getAttr('lines'));
    if (lines && lines.length > 0) {
      lines.map(item => {
        this.destroyArrow(item);
      });
    }
    blockElement.destroy();
    this.blockLayer.draw();
    this.dbCreate();
  }

  // 为 block 绑定事件
  blockEventBind(blockID = 0) {
    const currentBlocks = blockID ? this.blockLayer.find(`#${blockID}`) : this.blockLayer.find('.blockElement');
    currentBlocks.map(currentBlockItem => {
      // 改变文字内容
      const _this = this;
      currentBlockItem['changeText'] = function(_text) {
        currentBlockItem.findOne('.blockText').text(_text);
        _this.blockLayer.draw();
      };
      currentBlockItem.on('click', () => {
        this.resetActiveStatus(currentBlockItem.getAttr('id'));
      });
      const blockDash = currentBlockItem.findOne('.blockDash');
      // 虚线框事件监听
      blockDash.on('mouseenter', () => {
        this.stage.container().style.cursor = 'move';
      });
      blockDash.on('mouseleave', () => {
        this.stage.container().style.cursor = 'default';
      });
      blockDash.on('dragmove', () => {
        blockDash.opacity(1);
      });
      blockDash.on('dragend', () => {
        currentBlockItem.setPosition(blockDash.getAbsolutePosition());
        // blockElement 更新反馈
        this.updateBlockObserve.next(currentBlockItem);
        // 隐藏 blockDash
        blockDash.opacity(0);
        blockDash.x(0);
        blockDash.y(0);
        this.blockLayer.draw();
        const _lines = cloneDeep(blockDash.findAncestor('.blockElement').getAttr('lines'));
        if (_lines && _lines.length > 0) {
          _lines.map(item => {
            this.changeArrowPosition(item);
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
    const _attr = cloneDeep(_ctx.attrs);
    // 因为圆形没有width和height，所以在遇到圆形时需要根据radius计算出width和height
    if (_attr.hasOwnProperty('radius')) {
      _attr['width'] = _attr['height'] = _attr.radius * 2;
    }
    // 单个点合集
    const blockPointGroup = new Konva.Group({
      name: 'blockPointGroup'
    });
    const blockPointBorder = new Konva.Ring({
      x: 0,
      y: 0,
      innerRadius: 5,
      outerRadius: 11,
      fill: primaryStroke,
      opacity: 0,
      name: 'blockPointBorder'
    });
    const blockPointCircle = new Konva.Circle({
      x: 0,
      y: 0,
      radius: 5,
      fill: 'white',
      stroke: primaryStroke,
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
        x: _attr.hasOwnProperty('radius') ? axisArray[i].x - _attr.radius : axisArray[i].x,
        y: _attr.hasOwnProperty('radius') ? axisArray[i].y - _attr.radius : axisArray[i].y,
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

  // 拖拽点处理函数
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

  dragPointEnd(inheritID = undefined) {
    return new Promise(resolve => {
      this.stage.container().style.cursor = 'default';
      this.blockPointBorderVisiableSwitch(false);
      this.lineDrawing = false;
      // 清除虚线
      this.destroyDashLine();
      if (this.lineEndPoint) {
        // 判断当前是否只是更新部分内容（拖拽箭头位置）
        if (inheritID) {
          this.changeArrowPosition(inheritID);
        } else {
          this.createArrow();
        }
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  // point 环的显隐
  blockPointBorderVisiableSwitch(visiable) {
    this.blockLayer.find('.blockPointElement').map(fItem => {
      fItem.zIndex(visiable ? 3 : 0);
      fItem.opacity(visiable ? 1 : 0);
      fItem.find('.blockPointBorder').map(cItem => {
        cItem.opacity(visiable ? 0.5 : 0);
      });
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
        stroke: primaryStroke,
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

  // arrow 创建观察
  onCreateArrow() {
    return Observable.create(observer => {
      this.createArrowObserve = observer;
    });
  }

  // arrow 更新观察
  onUpdateArrow() {
    return Observable.create(observer => {
      this.updateArrowObserve = observer;
    });
  }

  // 绘制 arrowLine
  createArrow(_startPointID, _endPointID, _arrowID) {
    const _arrowElementID = _arrowID ? _arrowID : this.randomID();
    const _arrowStartPoint = _startPointID ? this.blockLayer.findOne(`#${_startPointID}`) : this.lineStartPoint;
    const _arrowEndPoint = _endPointID ? this.blockLayer.findOne(`#${_endPointID}`) : this.lineEndPoint;
    if (_arrowStartPoint && _arrowEndPoint) {
      // 销毁原有的箭头线段
      if (_arrowID) {
        this.destroyArrow(_arrowID);
      }
      const startPos = _arrowStartPoint.absolutePosition(),
        endPos = _arrowEndPoint.absolutePosition();
      const arrowElement = new Konva.Group({
        name: 'arrowElement',
        id: _arrowElementID,
        startPoint: _arrowStartPoint.getAttr('id'),
        endPoint: _arrowEndPoint.getAttr('id')
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
      // 将 arrow 的 id 分别添加入起始 block 和结束 block 的 lines 属性中
      this.insertArrowIDToBlockLines(_arrowElementID);
      this.resetActiveStatus(_arrowElementID);
      this.arrowEventBind(_arrowElementID);
      this.dbCreate();
      // 监听回调
      _arrowID ? this.updateArrowObserve.next(arrowElement) : this.createArrowObserve.next(arrowElement);
      return _arrowElementID;
    }
  }

  // 更新所连接的 block 内的 lines 属性
  removeArrowIDFromBlockLines(arrowID) {
    const _arrowElement = this.lineLayer.findOne(`#${arrowID}`);
    ['startPoint', 'endPoint'].map(item => {
      const _ancestor = this.blockLayer.findOne(`#${_arrowElement.getAttr(item)}`).findAncestor('.blockElement');
      const _lines = _ancestor.getAttr('lines');
      _lines.splice(_lines.indexOf(arrowID), 1);
      _ancestor.setAttr('lines', _lines);
    });
  }

  insertArrowIDToBlockLines(arrowID) {
    const startBlock = this.lineStartPoint.findAncestor('.blockElement'),
      endBlock = this.lineEndPoint.findAncestor('.blockElement');
    [startBlock, endBlock].map(item => {
      if (!item.attrs.hasOwnProperty('lines')) {
        item.setAttr('lines', []);
      }
      if (item.getAttr('lines').indexOf(arrowID) < 0) {
        const _linesArray = item.getAttr('lines');
        _linesArray.push(arrowID);
        item.setAttr('lines', _linesArray);
      }
    });
  }

  // 只更新 arrow 的连接点，不更新其他属性
  changeArrowPosition(arrowID) {
    // 更新连接点属性
    const _existLine = this.lineLayer.findOne(`#${arrowID}`);
    const startPos = this.lineStartPoint.absolutePosition(),
      endPos = this.lineEndPoint.absolutePosition();
    _existLine.findOne('.arrowLine').setAttr(
      'points',
      cornerPoints({
        entryPoint: [startPos.x, startPos.y],
        entryDirection: this.lineStartPoint.getAttr('direction'),
        exitPoint: [endPos.x, endPos.y],
        exitDirection: this.lineEndPoint.getAttr('direction')
      })
    );

    // 先删除之前关联的 block 内的 lines 属性
    this.removeArrowIDFromBlockLines(arrowID);
    // 为 arrow 添加 startPoint 和 endPoint 属性
    _existLine.setAttrs({
      startPoint: this.lineStartPoint.getAttr('id'),
      endPoint: this.lineEndPoint.getAttr('id')
    });
    // 为所连接的 block 更新 lines 属性
    this.insertArrowIDToBlockLines(arrowID);
    this.blockLayer.draw();
    this.lineLayer.draw();
    this.updateArrowObserve.next(_existLine);
    this.dbCreate();
  }

  // arrow 事件绑定
  arrowEventBind(arrowID = 0) {
    const arrowElement = arrowID ? this.lineLayer.find(`#${arrowID}`) : this.lineLayer.find('.arrowElement');
    arrowElement.map(arrowElementItem => {
      const arrowDragPoint = arrowElementItem.findOne('.arrowDragPoint');
      const arrowLine = arrowElementItem.findOne('.arrowLine');
      arrowLine.on('mouseenter', () => {
        arrowLine.stroke(primaryStroke);
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
        const _arrowID = arrowID ? arrowID : event.currentTarget.findAncestor('.arrowElement').id();
        await this.dragPointEnd(_arrowID);
        const endPos = arrowLine.getAttr('points').slice(-2);
        arrowDragPoint.x(endPos[0]);
        arrowDragPoint.y(endPos[1]);
        this.lineLayer.draw();
      });
    });
  }

  // 销毁 arrow
  destroyArrow(arrowID) {
    this.removeArrowIDFromBlockLines(arrowID);
    const _arrowElement = this.lineLayer.findOne(`#${arrowID}`);
    _arrowElement.destroy();
    this.lineLayer.draw();
    this.dbCreate();
  }

  // 设置激活状态
  resetActiveStatus(arrowID = undefined) {
    // 放置多次点击统一元素时多次触发 focus 和 blur 的监听
    if (this.focusElementID != arrowID) {
      const _prevElement = this.stage.findOne(`#${this.focusElementID}`);
      if (_prevElement) {
        this.elementBlurObserve.next(_prevElement);
      }
      this.focusElementID = arrowID;
      const _currentElement = this.stage.findOne(`#${arrowID}`);
      if (_currentElement) {
        this.elementFocusObserve.next(_currentElement);
      }
      this.resetActiveStatusOfBlock();
      this.resetActiveStatusOfArrow();
    }
    this.stage.draw();
  }

  onElementFocus() {
    return Observable.create(observer => {
      this.elementFocusObserve = observer;
    });
  }

  onElementBlur() {
    return Observable.create(observer => {
      this.elementBlurObserve = observer;
    });
  }

  resetActiveStatusOfBlock() {
    this.blockLayer.find('.blockElement').map(item => {
      const booleanValue = item.getAttr('id') === this.focusElementID;
      const _pElement = item.findOne('.blockPointElement');
      _pElement.zIndex(booleanValue ? 3 : 0);
      _pElement.opacity(booleanValue ? 1 : 0);
      _pElement.find('.blockPointGroup').map(pointItem => {
        booleanValue ? this.blockPointEventBind(pointItem) : pointItem.off('mouseenter');
      });
    });
    this.blockLayer.draw();
  }

  resetActiveStatusOfArrow() {
    this.lineLayer.find('.arrowElement').map(item => {
      const booleanValue = item.getAttr('id') === this.focusElementID;
      const _arrowLine = item.findOne('.arrowLine');
      _arrowLine.stroke(booleanValue ? primaryStroke : lineColor);
    });
    this.lineLayer.draw();
  }

  delegate(agent, type, selctor, fn) {
    //agent.addEventListener(type,fn)如果是这样fn中的this会指向agent
    agent.addEventListener(
      type,
      function(e) {
        let target = e.target; //target指向实际点击的最里层的元素
        let ctarget = e.currentTarget; //ctarget会永远指向agent
        let bubble = true;
        while (bubble && target != ctarget) {
          if (target.matches(selctor)) {
            //改变this的指向
            bubble = fn.call(target, e) === false ? false : true;
          }
          target = target.parentNode; //模拟事件冒泡
          if (!bubble) {
            e.preventDefault();
          }
        }
      },
      false
    );
  }

  hasClass(elem, cls) {
    cls = cls || '';
    if (cls.replace(/\s/g, '').length == 0) return false; //当cls没有参数时，返回false
    return new RegExp(' ' + cls + ' ').test(' ' + elem.className + ' ');
  }

  addClass(ele, cls) {
    if (!this.hasClass(ele, cls)) {
      ele.className = ele.className == '' ? cls : ele.className + ' ' + cls;
    }
  }

  removeClass(ele, cls) {
    if (this.hasClass(ele, cls)) {
      var newClass = ' ' + ele.className.replace(/[\t\r\n]/g, '') + ' ';
      while (newClass.indexOf(' ' + cls + ' ') >= 0) {
        newClass = newClass.replace(' ' + cls + ' ', ' ');
      }
      ele.className = newClass.replace(/^\s+|\s+$/g, '');
    }
  }

  // frame
  frameInit() {
    // 重置数据库
    this.dbInit();
    // 监听顶部按钮
    const cadeHeader = document.querySelector('.cade-header');
    this.delegate(cadeHeader, 'click', '#cade-undo-btn', () => {
      if (this.historyIndex >= 0) {
        this.historyIndex -= 1;

        localforage.getItem(this.historyArray[this.historyIndex]).then(res => {
          this.stageImport(res);
        });
      }
      this.historyBtnActive();
    });
    this.delegate(cadeHeader, 'click', '#cade-redo-btn', () => {
      const historyLength = this.historyArray.length;
      if (historyLength > 0 && this.historyIndex < historyLength) {
        this.historyIndex += 1;
        localforage.getItem(this.historyArray[this.historyIndex]).then(res => {
          this.stageImport(res);
        });
      }
      this.historyBtnActive();
    });
    this.historyBtnActive();
    this.delegate(cadeHeader, 'click', '#cade-delete-btn', () => {
      this.elementDelete();
    });
    this.delegate(cadeHeader, 'click', '#cade-save-btn', () => {});
    this.delegate(cadeHeader, 'click', '#cade-empty-btn', () => {
      this.stageClear();
    });
    this.delegate(cadeHeader, 'click', '#cade-export-btn', () => {
      localStorage.jsonData = this.stage.toJSON();
    });
    this.delegate(cadeHeader, 'click', '#cade-import-btn', () => {
      this.stageImport();
    });
    this.delegate(cadeHeader, 'dragstart', '.cade-header-btn', event => {
      this.elementType = event.target.attributes.elementType.value;
    });
    // 监听键盘事件
    document.querySelector('body').addEventListener('keyup', event => {
      if (event.keyCode === 8) {
        this.elementDelete();
      }
    });
    // chrome 下需要阻止dragenter和dragover的默认行为才可以触发drop
    const body = document.querySelector('body');
    this.delegate(body, 'dragenter', '#cade-content', event => {
      event.preventDefault();
    });
    this.delegate(body, 'dragover', '#cade-content', event => {
      event.preventDefault();
    });
    this.delegate(body, 'drop', '#cade-content', event => {
      if (event.target.tagName === 'CANVAS') {
        this.createBlock({
          x: event.offsetX,
          y: event.offsetY,
          type: this.elementType
        });
        this.stage.draw();
      }
    });
  }

  historyBtnActive() {
    const undoBtn = document.querySelector('#cade-undo-btn'),
      redoBtn = document.querySelector('#cade-redo-btn');
    const historyLength = this.historyArray.length;
    if (this.historyIndex < 0) {
      this.addClass(undoBtn, 'disable');
    } else {
      this.removeClass(undoBtn, 'disable');
    }
    if (this.historyIndex >= historyLength - 1) {
      this.addClass(redoBtn, 'disable');
    } else {
      this.removeClass(redoBtn, 'disable');
    }
  }

  elementDelete() {
    const focusElement = this.stage.findOne(`#${this.focusElementID}`);
    switch (focusElement.getAttr('name')) {
      case 'blockElement':
        this.destroyBlock(this.focusElementID);
        break;
      case 'arrowElement':
        this.destroyArrow(this.focusElementID);
        break;
    }
  }

  // 数据存储重置
  dbInit() {
    localforage.clear();
    this.historyArray = [];
    this.historyIndex = -1;
  }

  dbCreate() {
    const _storageKey = this.randomID();
    return localforage.setItem(_storageKey, this.stage.toJSON(), () => {
      this.historyArray.push(_storageKey);
      this.historyIndex += 1;
      if (this.historyArray.length - 1 > this.historyIndex) {
        this.historyArray.splice(0, this.historyIndex);
      }
      this.historyBtnActive();
    });
  }
}

export { Cade };
