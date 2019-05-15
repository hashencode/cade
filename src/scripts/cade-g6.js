import G6 from '@antv/g6';
const Util = G6.Util;
const G6grid = require('@antv/g6/build/grid');
const blueStroke = '#5dafff',
  blueFill = '#e7f7ff',
  blueActive = '#94d4fc',
  yellowStroke = '#ffc576',
  yellowFill = '#fef7e7',
  pinkStroke = '#bd90ee',
  pinkFill = '#f9efff',
  pinkActive = '#d2aef6',
  lineColor = '#abb7c5';

class Cade {
  constructor() {
    this.graph = null;
  }

  // 生成唯一ID
  randomID() {
    return Number(
      Math.random()
        .toString()
        .substr(3, 10) + Date.now()
    ).toString(36);
  }

  // 初始化舞台
  stageInit() {
    // 注册自定义元素
    this.shapeRegister();
    // 注册自定义模式
    this.behaviorRegister();
    // 初始化舞台
    const cadeStageElement = document.querySelector('#cadeStage');
    this.graph = new G6.Graph({
      container: 'cadeStage',
      width: cadeStageElement.clientWidth,
      height: cadeStageElement.clientHeight,
      modes: {
        default: ['activate-node', 'drag-node', 'drag-canvas', 'zoom-canvas'],
        drawLine: ['click-add-edge', 'activate-node']
      },
      plugins: [new G6grid()]
    });
  }

  // 绘制方形
  createRect(cfg = {}) {
    this.graph.add('node', { x: cfg.x, y: cfg.y, shape: 'c-rect', id: 2 });
  }

  // 创建菱形
  createDiamond(cfg = {}) {
    this.graph.add('node', { x: cfg.x, y: cfg.y, shape: 'c-diamond', id: this.randomID() });
  }

  shapeRegister() {
    const commonConfig = {
      cursor: 'move',
      shadowColor: 'rgba(0,0,0,.1)',
      shadowBlur: 10,
      shadowOffsetY: 4
    };
    // 注册自定义节点类型
    // 节点：菱形
    G6.registerNode('c-diamond', {
      draw(cfg, group) {
        const size = cfg.size || [90, 70]; // 如果没有 size 时的默认大小
        const width = size[0];
        const height = size[1];
        const shape = group.addShape('path', {
          attrs: Object.assign(
            {
              id: cfg.id,
              path: [
                ['M', 0, -height / 2], // 上部顶点
                ['L', width / 2, 0], // 右侧点
                ['L', 0, height / 2], // 下部
                ['L', -width / 2, 0], // 左侧
                ['Z'] // 封闭
              ],
              stroke: cfg.color || pinkStroke,
              fill: cfg.fill || pinkFill,
              width: width,
              height: height
            },
            commonConfig
          )
        });
        group.addShape('text', {
          attrs: {
            x: 0, // 居中
            y: 0,
            textAlign: 'center',
            textBaseline: 'middle',
            text: cfg.label || '判断',
            fill: '#666',
            cursor: 'move'
          }
        });
        [{ x: 0, y: -height / 2 }, { x: width / 2, y: 0 }, { x: 0, y: height / 2 }, { x: -width / 2, y: 0 }].forEach(posItem => {
          group.addShape('circle', {
            attrs: {
              x: posItem.x,
              y: posItem.y,
              r: 4,
              fill: blueFill,
              stroke: blueStroke,
              cursor: 'crosshair',
              class: 'anchorPoint',
              opacity: 0
            }
          });
        });
        return shape;
      },
      // 设置锚点
      getAnchorPoints() {
        return [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]];
      },
      // 设置状态
      setState(name, value, item) {
        const group = item.getContainer();
        const path = group.get('children')[0];
        if (name === 'active') {
          // 改变背景色
          path.attr('fill', value ? pinkActive : pinkFill);
          group
            .findAll(node => {
              return node.attr('class') === 'anchorPoint';
            })
            .map(anchor => {
              anchor.attr('opacity', value ? 1 : 0);
            });
        }
      }
    });
    // 节点：矩形
    G6.registerNode('c-rect', {
      draw(cfg, group) {
        const size = cfg.size || [150, 40]; // 如果没有 size 时的默认大小
        const width = size[0];
        const height = size[1];
        const shape = group.addShape('path', {
          attrs: Object.assign(
            {
              id: cfg.id,
              path: [
                ['M', -width / 2, -height / 2], // 上部顶点
                ['L', width / 2, -height / 2], // 右侧点
                ['L', width / 2, height / 2], // 下部
                ['L', -width / 2, height / 2], // 左侧
                ['Z'] // 封闭
              ],
              stroke: cfg.color || blueStroke,
              fill: cfg.fill || blueFill
            },
            commonConfig
          )
        });
        group.addShape('text', {
          attrs: {
            x: 0, // 居中
            y: 0,
            textAlign: 'center',
            textBaseline: 'middle',
            text: cfg.label || '节点',
            fill: '#666',
            cursor: 'move'
          }
        });
        return shape;
      },
      // 设置锚点
      getAnchorPoints() {
        return [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]];
      },
      // 设置状态
      setState(name, value, item) {
        if (name === 'active') {
          item
            .getContainer()
            .get('children')[0]
            .attr('fill', value ? blueActive : blueFill);
        }
      }
    });
  }

  // 注册自定义交互
  behaviorRegister() {
    // 交互：鼠标点击时高亮元素，点击其他元素时复原
    G6.registerBehavior('activate-node', {
      getEvents() {
        return {
          'node:click': 'onNodeClick',
          'canvas:click': 'onCanvasClick'
        };
      },
      onNodeClick(e) {
        const item = e.item;
        if (item.hasState('active')) {
          this.graph.setItemState(item, 'active', false);
          return;
        }
        this.removeNodesState();
        // 置点击的节点状态为active
        this.graph.setItemState(item, 'active', true);
      },
      onCanvasClick(e) {
        this.removeNodesState();
      },
      removeNodesState() {
        this.graph.findAllByState('node', 'active').forEach(node => {
          this.graph.setItemState(node, 'active', false);
        });
      }
    });
    // 交互：点击添加边
    G6.registerBehavior('click-add-edge', {
      getEvents() {
        return {
          'node:click': 'onClick',
          mousemove: 'onMousemove'
        };
      },
      onClick(ev) {
        const node = ev.item;
        const graph = this.graph;
        const point = { x: ev.x, y: ev.y };
        const model = node.getModel();
        // 如果在添加边的过程中，再次点击另一个节点，结束边的添加
        if (this.addingEdge && this.edge) {
          graph.updateItem(this.edge, {
            target: model.id
          });
          this.edge = null;
          this.addingEdge = false;
        } else {
          // 点击节点，触发增加边
          this.edge = graph.addItem('edge', {
            source: model.id,
            target: point
          });
          this.addingEdge = true;
        }
      },
      onMousemove(ev) {
        const point = { x: ev.x, y: ev.y };
        if (this.addingEdge && this.edge) {
          // 增加边的过程中，移动时边跟着移动
          this.graph.updateItem(this.edge, {
            target: point
          });
        }
      }
    });
  }
}

export { Cade };
