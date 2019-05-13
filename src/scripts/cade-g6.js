import G6 from '@antv/g6';
const Util = G6.Util;
const blueStroke = '#5dafff',
  blueFill = '#e7f7ff',
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
    // 注册自定义节点类型
    const _this = this;
    G6.registerNode('c-diamond', {
      draw(cfg, group) {
        const size = cfg.size || [80, 70]; // 如果没有 size 时的默认大小
        const width = size[0];
        const height = size[1];
        const shape = group.addShape('path', {
          attrs: {
            id: _this.randomID(),
            path: [
              ['M', 0, 0 - height / 2], // 上部顶点
              ['L', width / 2, 0], // 右侧点
              ['L', 0, height / 2], // 下部
              ['L', -width / 2, 0], // 左侧
              ['Z'] // 封闭
            ],
            stroke: cfg.color || pinkStroke,
            fill: cfg.fill || pinkFill,
            cursor: 'move'
          }
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
            .attr('fill', value ? pinkActive : pinkFill);
        }
      }
    });
    // 注册自定义模式
    G6.registerBehavior('activate-node', {
      getEvents() {
        return {
          'node:click': 'onNodeClick',
          'canvas:click': 'onCanvasClick'
        };
      },
      onNodeClick(e) {
        console.log('me');
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
        console.log(this.graph.findAllByState('active'));
        this.graph.findAllByState('active').forEach(node => {
          this.graph.setItemState(node, 'active', false);
        });
      }
    });
    // 初始化舞台
    const cadeStageElement = document.querySelector('#cadeStage');
    this.graph = new G6.Graph({
      container: 'cadeStage',
      width: cadeStageElement.clientWidth,
      height: cadeStageElement.clientHeight,
      modes: {
        default: ['activate-node'],
        dragNode: ['drag-node'],
        dragStage: ['drag-canvas']
      }
    });
  }

  // 绘制方形
  createRect(cfg = {}) {
    const data = {
      nodes: [
        {
          id: this.randomID(),
          x: cfg.x || 100,
          y: cfg.x || 35,
          shape: 'rect',
          label: cfg.label || '方形',
          size: cfg.size || [80, 50],
          style: {
            stroke: cfg.stroke || blueStroke,
            fill: cfg.fill || blueFill,
            radius: 3
          },
          cursor: 'pointer'
        },
        { x: 350, y: 100, shape: 'c-diamond' }
      ]
    };
    this.graph.data(data);
    this.graph.render();
  }
}

export { Cade };
