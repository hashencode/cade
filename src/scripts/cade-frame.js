class cadeFrame {
  constructor(Cade) {
    this.Cade = Cade;
  }

  frameInit() {
    document.querySelector('.export-btn').addEventListener('click', () => {
      localStorage.jsonData = this.Cade.stage.toJSON();
    });
    document.querySelector('.import-btn').addEventListener('click', () => {
      this.Cade.stage.clear();
      const jsonData = localStorage.jsonData;
      this.Cade.stage = Konva.Node.create(jsonData, 'cade-content');
      this.Cade.stage.children.map(layerItem => {
        this.Cade[layerItem.attrs.name] = layerItem;
      });
      this.Cade.stage.draw();
      this.Cade.stageEventBind();
      this.Cade.blockEventBind();
      this.Cade.arrowEventBind();
      this.Cade.resetActiveStatus();
    });
  }
}

export { cadeFrame };
