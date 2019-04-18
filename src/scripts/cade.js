import cornerPoints from './corner-points';
import ResizeObserver from 'resize-observer-polyfill';
import { Observable } from 'rxjs';
import { cloneDeep } from 'lodash';
import * as localforage from 'localforage';

const blueStroke = '#5dafff',
  blueFill = '#e7f7ff',
  yellowStroke = '#ffc576',
  yellowFill = '#fef7e7',
  pinkStroke = '#bd90ee',
  pinkFill = '#f9efff',
  lineColor = '#abb7c5';
class Cade {
  constructor() {
    this.stage = null;
    this.lineStartPoint = null; // arrow 起始点
    this.lineEndPoint = null; // arrow 终点
    this.focusElementID = null; // 当前选择 element id
    this.createBlockObserve = null; // block 创建监听
    this.updateBlockObserve = null; // block 更新监听
    this.createArrowObserve = null; // arrow 创建监听
    this.updateArrowObserve = null; // arrow 更新监听
    this.elementFocusObserve = null; // element激活监听
    this.elementBlurObserve = null; // element释放监听
    this.historyArray = [];
    this.historyIndex = -1;
    this.zoomvalue = 1;
  }

  // 生成唯一ID
  randomID() {
    return Number(
      Math.random()
        .toString()
        .substr(3, 10) + Date.now()
    ).toString(36);
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
    this.actionLayer = new Konva.Layer({
      name: 'actionLayer'
    });
    this.stage.add(this.blockLayer);
    this.stage.add(this.lineLayer);
    this.stage.add(this.actionLayer);
    this.stageEventBind();
    // 监听窗口尺寸变化
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
    let blockElement, arrowElement, moveStartPoint, arrowCreating, arrowUpdating, blockDragging, focusElement;
    this.stage.on('click', event => {
      // 判断当前点击是否是在空白区域，如果是，则清除所有选中状态
      if (event.currentTarget == event.target) {
        this.focusElementID = null;
        this.resetActiveStatus();
        this.elementBlurObserve.next();
      }
    });
    this.stage.on('mousedown', event => {
      // 根据点击的元素的祖先元素不同，触发不同的方法
      const latestAncestor = this.findLatestAncestor(event);
      switch (latestAncestor.class) {
        case 'blockPointElement':
          // 判断当前blockPoint的祖先blockElement是否已经激活
          if (focusElement && this.focusElementID === focusElement.getAttr('id')) {
            this.lineStartPoint = event.target.findAncestor('.blockPointGroup');
            // 显示所有圆环
            this.blockPointBorderVisiableSwitch(true);
            arrowCreating = true;
          }
          break;
        case 'blockElement':
          blockElement = latestAncestor.ancestor;
          moveStartPoint = {
            x: event.evt.clientX,
            y: event.evt.clientY
          };
          blockDragging = true;
          break;
        case 'arrowElement':
          arrowElement = latestAncestor.ancestor;
          this.lineStartPoint = this.blockLayer.findOne(`#${arrowElement.getAttr('startPoint')}`);
          // 显示所有圆环
          this.blockPointBorderVisiableSwitch(true);
          arrowUpdating = true;
          break;
        default:
          break;
      }
    });

    this.stage.on('mousemove', event => {
      if (arrowCreating) {
        this.dragPointTouch(event);
      } else if (arrowUpdating) {
        this.dragPointTouch(event);
      } else if (blockDragging) {
        this.createBlockDash(event, moveStartPoint, blockElement);
      } else {
        // 根据点击的元素的祖先元素不同，触发不同的方法
        const latestAncestor = this.findLatestAncestor(event);
        switch (latestAncestor.class) {
          case 'blockPointElement':
            // 判断当前blockPoint的祖先blockElement是否已经激活
            if (focusElement && this.focusElementID === focusElement.getAttr('id')) {
              this.stage.container().style.cursor = 'crosshair';
            }
            break;
          case 'blockElement':
            this.stage.container().style.cursor = 'move';
            break;
          case 'arrowElement':
            this.stage.container().style.cursor = 'crosshair';
            break;
          default:
            this.stage.container().style.cursor = 'default';
            break;
        }
      }
    });

    this.stage.on('mouseup', () => {
      // 若当前是画线状态，则清除圆环，并触发dragPointEnd
      if (arrowCreating) {
        arrowCreating = false;
        // 清除所有圆环显示
        this.blockPointBorderVisiableSwitch(false);
        this.dragPointEnd();
      }
      if (arrowUpdating) {
        arrowUpdating = false;
        // 激活当前元素
        this.focusElementID = arrowElement.getAttr('id');
        focusElement = arrowElement;
        this.resetActiveStatus();
        // 清除所有圆环显示
        this.blockPointBorderVisiableSwitch(false);
        const arrowID = arrowElement.getAttr('id');
        this.dragPointEnd(arrowID);
        this.changeArrowPosition(arrowID);
      }
      // 若当前是block拖拽状态，则重新定位block，并删除blockDash
      if (blockDragging) {
        blockDragging = false;
        // 激活当前元素
        this.focusElementID = blockElement.getAttr('id');
        focusElement = blockElement;
        this.resetActiveStatus();
        // 更改block位置
        const blockDashElement = this.actionLayer.findOne('.blockDashElement');
        if (blockDashElement) {
          const blockDashPos = blockDashElement.getAbsolutePosition();
          blockElement.x(blockDashPos.x);
          blockElement.y(blockDashPos.y);
          blockDashElement.destroy();
          this.actionLayer.draw();
          // 更新与block关联的arrow的位置
          const _lines = cloneDeep(blockElement.getAttr('lines'));
          if (_lines && _lines.length > 0) {
            _lines.map(item => {
              this.changeArrowPosition(item, true);
            });
          }
          this.blockLayer.draw();
          // blockElement 更新反馈
          this.updateBlockObserve ? this.updateBlockObserve.next(blockElement) : '';
        }
      }
    });
  }

  // 清空stage
  stageClear() {
    this.stage.children.map(layerItem => {
      this[layerItem.attrs.name].destroyChildren();
    });
    this.stage.draw();
  }

  // 导入数据
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
  }

  findLatestAncestor(event) {
    if (event.target.attrs.hasOwnProperty('name')) {
      if (/blockPoint*/.test(event.target.attrs.name)) {
        // 如果当前点击的是 blockPoint
        return {
          class: 'blockPointElement',
          ancestor: event.target.findAncestor('.blockPointElement', true)
        };
      } else if (/block*/.test(event.target.attrs.name)) {
        // 如果当前点击的是 blockElement
        return {
          class: 'blockElement',
          ancestor: event.target.findAncestor('.blockElement', true)
        };
      } else if (/arrow*/.test(event.target.attrs.name)) {
        // 如果当前点击的是 arrowElement
        return {
          class: 'arrowElement',
          ancestor: event.target.findAncestor('.arrowElement', true)
        };
      } else {
        return { class: '' };
      }
    } else {
      return { class: '' };
    }
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
      shadowOpacity: 0.5,
      strokeWidth: 1,
      name: 'blockShape'
    };
    let block,
      elementConfig,
      groupConfig = { x: config ? config.x : 0, y: config ? config.y : 0 },
      blockTextConfig = {};
    // 绘制框体
    switch (config.type) {
      // 如果是矩形
      case 'rect':
        elementConfig = Object.assign(
          {
            width: 170,
            height: 40,
            fill: blueFill,
            stroke: blueStroke,
            fillColor: blueFill,
            cornerRadius: 4
          },
          commonBlockConfig
        );
        groupConfig = { x: config ? config.x - elementConfig.width / 2 : 0, y: config ? config.y - elementConfig.height / 2 : 0 };
        // 绘制 block
        block = new Konva.Rect(elementConfig);
        break;
      // 如果是圆形
      case 'circle':
        elementConfig = Object.assign(
          {
            width: 80,
            height: 80,
            fill: yellowFill,
            stroke: yellowStroke,
            fillColor: yellowFill
          },
          commonBlockConfig
        );
        blockTextConfig = { x: -elementConfig.width / 2, y: -elementConfig.height / 2 };
        // 绘制 block
        block = new Konva.Circle(elementConfig);
        break;
      case 'polygon':
        elementConfig = Object.assign(
          {
            width: 80,
            height: 80,
            fill: pinkFill,
            stroke: pinkStroke,
            sides: 4,
            fillColor: pinkFill
          },
          commonBlockConfig
        );
        blockTextConfig = { x: -elementConfig.width / 2, y: -elementConfig.height / 2 };
        // 绘制 block
        block = new Konva.RegularPolygon(elementConfig);
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
    blockElement.add(this.createBlockPoint(block));
    this.blockLayer.add(blockElement);
    this.blockLayer.draw();
    this.dbCreate();
    // blockElement 创建反馈
    this.createBlockObserve ? this.createBlockObserve.next(blockElement) : '';
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
      outerRadius: 13,
      fill: blueStroke,
      opacity: 0,
      name: 'blockPointBorder'
    });
    const blockPointCircle = new Konva.Circle({
      x: 0,
      y: 0,
      radius: 5,
      fill: 'white',
      stroke: blueStroke,
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

  // 绘制虚线框
  createBlockDash(event, moveStartPoint, blockElement) {
    const prevBlockDash = this.actionLayer.findOne('.blockDashElement');
    if (prevBlockDash) {
      prevBlockDash.destroy();
    }
    const blockElementPos = blockElement.getAbsolutePosition();
    const blockDashElement = blockElement.findOne('.blockShape').clone({
      dash: [5],
      name: 'blockDashElement',
      fill: 'transparent',
      x: blockElementPos.x,
      y: blockElementPos.y
    });
    blockDashElement.move({
      x: event.evt.clientX - moveStartPoint.x,
      y: event.evt.clientY - moveStartPoint.y
    });
    this.actionLayer.add(blockDashElement);
    this.actionLayer.draw();
  }

  // 删除block
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

  // 鼠标与blockPoint相交函数
  dragPointTouch(event) {
    // 找到与鼠标当前位置相交的 blockPointGroup，如果相交则设置为 lineEndPoint
    const touchShape = this.blockLayer.getIntersection(this.stage.getPointerPosition(), 'Group');
    this.lineEndPoint =
      touchShape && touchShape.getAttr('name') === 'blockPointGroup' && touchShape._id !== this.lineStartPoint._id ? touchShape : null;
    this.createDashLine(event.evt);
  }

  // 释放鼠标时清除dashLine并更新arrow
  dragPointEnd(inheritID = undefined) {
    // 清除虚线
    if (this.actionLayer.findOne(`.dashLine`)) {
      this.actionLayer.findOne(`.dashLine`).destroy();
      this.actionLayer.draw();
    }
    // 判断当前是否只是更新部分内容（拖拽箭头位置）
    this.lineEndPoint && inheritID ? this.changeArrowPosition(inheritID) : this.createArrow();
  }

  // point 环的显隐
  blockPointBorderVisiableSwitch(visiable) {
    this.blockLayer.find('.blockPointElement').map(fItem => {
      fItem.opacity(visiable ? 1 : 0);
      fItem.find('.blockPointBorder').map(cItem => {
        cItem.opacity(visiable ? 0.3 : 0);
      });
    });
    this.blockLayer.draw();
  }

  // 绘制 dashLine
  createDashLine(mousePos) {
    const lineByName = this.actionLayer.findOne(`.dashLine`),
      linePos = this.lineStartPoint.absolutePosition(),
      // 对比宽高，设置不同的显示方式
      _width = Math.abs(mousePos.offsetX - linePos.x),
      _height = Math.abs(mousePos.offsetY - linePos.y);
    let cornerX, cornerY;
    if (_width >= _height) {
      cornerX = mousePos.offsetX - linePos.x >= 0 ? linePos.x + _width : linePos.x - _width;
      cornerY = linePos.y;
    } else {
      cornerX = linePos.x;
      cornerY = mousePos.offsetY - linePos.y >= 0 ? linePos.y + _height : linePos.y - _height;
    }
    // 判断当前是否已经存在虚线，如果存在则更新而不创建
    if (lineByName) {
      lineByName.setAttrs({ points: [linePos.x, linePos.y, cornerX, cornerY, mousePos.offsetX, mousePos.offsetY] });
      lineByName.getParent().draw();
    } else {
      const line = new Konva.Line({
        points: [linePos.x, linePos.y, cornerX, cornerY, mousePos.offsetX, mousePos.offsetY],
        stroke: blueStroke,
        name: 'dashLine',
        dash: [5]
      });
      this.actionLayer.add(line);
    }
  }

  // 绘制 arrowLine
  createArrow() {
    const _arrowElementID = this.randomID();
    if (this.lineStartPoint && this.lineEndPoint) {
      const startPos = this.lineStartPoint.absolutePosition(),
        endPos = this.lineEndPoint.absolutePosition();
      const arrowElement = new Konva.Arrow({
        points: cornerPoints({
          entryPoint: [startPos.x, startPos.y],
          entryDirection: this.lineStartPoint.getAttr('direction'),
          exitPoint: [endPos.x, endPos.y],
          exitDirection: this.lineEndPoint.getAttr('direction')
        }),
        startPoint: this.lineStartPoint.getAttr('id'),
        endPoint: this.lineEndPoint.getAttr('id'),
        stroke: lineColor,
        pointerLength: 6,
        pointerWidth: 5,
        name: 'arrowElement',
        id: _arrowElementID,
        lineCap: 'round',
        lineJoin: 'round'
      });
      this.lineLayer.add(arrowElement);
      this.lineLayer.draw();
      // 将 arrow 的 id 分别添加入起始 block 和结束 block 的 lines 属性中
      this.insertArrowIDToBlockLines(_arrowElementID);
      this.dbCreate();
      // 激活当前 arrow
      this.focusElementID = _arrowElementID;
      this.resetActiveStatus();
      // 监听回调
      this.updateArrowObserve ? this.createArrowObserve.next(arrowElement) : '';
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
    const currentLine = this.lineLayer.findOne(`#${arrowID}`);
    const startBlock = this.blockLayer.findOne(`#${currentLine.getAttr('startPoint')}`).findAncestor('.blockElement'),
      endBlock = this.blockLayer.findOne(`#${currentLine.getAttr('endPoint')}`).findAncestor('.blockElement');
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
  changeArrowPosition(arrowID, isBlockMove = false) {
    // 更新连接点属性
    const _existLine = this.lineLayer.findOne(`#${arrowID}`);
    const _arrowStartPoint = isBlockMove ? this.blockLayer.findOne(`#${_existLine.getAttr('startPoint')}`) : this.lineStartPoint;
    const _arrowEndPoint = isBlockMove ? this.blockLayer.findOne(`#${_existLine.getAttr('endPoint')}`) : this.lineEndPoint;
    const startPos = _arrowStartPoint.absolutePosition(),
      endPos = _arrowEndPoint.absolutePosition();
    _existLine.setAttr(
      'points',
      cornerPoints({
        entryPoint: [startPos.x, startPos.y],
        entryDirection: _arrowStartPoint.getAttr('direction'),
        exitPoint: [endPos.x, endPos.y],
        exitDirection: _arrowEndPoint.getAttr('direction')
      })
    );
    // 先删除之前关联的 block 内的 lines 属性
    this.removeArrowIDFromBlockLines(arrowID);
    // 为 arrow 添加 startPoint 和 endPoint 属性
    _existLine.setAttrs({
      startPoint: _arrowStartPoint.getAttr('id'),
      endPoint: _arrowEndPoint.getAttr('id')
    });
    // 为所连接的 block 更新 lines 属性
    this.insertArrowIDToBlockLines(arrowID);
    this.blockLayer.draw();
    this.lineLayer.draw();
    this.updateArrowObserve ? this.updateArrowObserve.next(_existLine) : '';
    this.dbCreate();
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
  resetActiveStatus() {
    if (this.focusElementID) {
      this.elementFocusObserve.next(this.stage.findOne(`#${this.focusElementID}`));
    }
    this.resetActiveStatusOfBlock();
    this.resetActiveStatusOfArrow();
  }

  resetActiveStatusOfBlock() {
    this.blockLayer.find('.blockElement').map(item => {
      const booleanValue = item.getAttr('id') === this.focusElementID;
      const blockShape = item.findOne('.blockShape');
      blockShape.setAttr('fill', booleanValue ? blockShape.getAttr('stroke') : blockShape.getAttr('fillColor'));
      const _pElement = item.findOne('.blockPointElement');
      _pElement.opacity(booleanValue ? 1 : 0);
    });
    this.blockLayer.draw();
  }

  resetActiveStatusOfArrow() {
    this.lineLayer.find('.arrowElement').map(item => {
      item.stroke(item.getAttr('id') === this.focusElementID ? blueStroke : lineColor);
      item.draw();
    });
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
    // 回退
    this.delegate(cadeHeader, 'click', '#cade-redo-btn', () => {
      const historyLength = this.historyArray.length;
      if (historyLength > 0 && this.historyIndex < historyLength - 1) {
        this.historyIndex += 1;
        localforage.getItem(this.historyArray[this.historyIndex]).then(res => {
          this.stageImport(res);
        });
      }
      this.historyBtnActive();
    });
    this.historyBtnActive();
    // 重做
    this.delegate(cadeHeader, 'click', '#cade-delete-btn', () => {
      this.elementDelete();
    });
    // this.delegate(cadeHeader, 'click', '#cade-save-btn', () => {});
    // 清空
    this.delegate(cadeHeader, 'click', '#cade-empty-btn', () => {
      this.stageClear();
    });
    // 缩放
    this.delegate(cadeHeader, 'click', '#cade-zoom-up', () => {
      this.zoomvalue += this.zoomvalue < 1.5 ? 0.1 : 0;
      this.stage.scale({
        x: this.zoomvalue,
        y: this.zoomvalue
      });
      this.stage.draw();
    });
    this.delegate(cadeHeader, 'click', '#cade-zoom-down', () => {
      this.zoomvalue -= this.zoomvalue > 0.5 ? 0.1 : 0;
      this.stage.scale({
        x: this.zoomvalue,
        y: this.zoomvalue
      });
      this.stage.draw();
    });
    // 导出数据
    // this.delegate(cadeHeader, 'click', '#cade-export-btn', () => {
    //   localStorage.jsonData = this.stage.toJSON();
    // });
    // 导入数据
    // this.delegate(cadeHeader, 'click', '#cade-import-btn', () => {
    //   this.stageImport();
    // });
    // 创建图形
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
    if (this.historyIndex !== this.historyArray.length - 1) {
      this.historyArray.splice(this.historyIndex + 1);
    }
    const _storageKey = this.randomID();
    localforage.setItem(_storageKey, this.stage.toJSON(), () => {
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
