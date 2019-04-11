class cadeFrame {
  constructor(cade) {
    this.cade = cade;
    this.elementType = 'rect';
  }

  frameInit() {
    document.querySelector('.export-btn').addEventListener('click', () => {
      localStorage.jsonData = this.cade.stage.toJSON();
    });
    document.querySelector('.import-btn').addEventListener('click', () => {
      this.cade.stage.clear();
      const jsonData = localStorage.jsonData;
      this.cade.stage = Konva.Node.create(jsonData, 'cade-content');
      this.cade.stage.children.map(layerItem => {
        this.cade[layerItem.attrs.name] = layerItem;
      });
      this.cade.stage.draw();
      this.cade.stageEventBind();
      this.cade.blockEventBind();
      this.cade.arrowEventBind();
      this.cade.resetActiveStatus();
    });
    const cadeBlockElement = document.querySelectorAll('.cade-blockElement');
    for (let index = 0; index < cadeBlockElement.length; index++) {
      cadeBlockElement[index].addEventListener('dragstart', event => {
        this.elementType = event.target.attributes.elementtype.value;
      });
    }
    // chrome 下需要阻止dragenter和dragover的默认行为才可以触发drop
    document.querySelector('#cade-content').addEventListener('dragenter', event => {
      event.preventDefault();
    });
    document.querySelector('#cade-content').addEventListener('dragover', event => {
      event.preventDefault();
    });
    document.querySelector('#cade-content').addEventListener('drop', event => {
      if (event.target.tagName === 'CANVAS') {
        switch (this.elementType) {
          case 'rect':
            this.cade.createBlock({
              x: event.offsetX,
              y: event.offsetY
            });
            break;
        }
        this.cade.stage.draw();
      }
    });
  }

  switchPanel(isOpen) {
    document.querySelector('#cade-panel').setAttribute('class', isOpen ? 'active' : '');
  }
}

export { cadeFrame };
