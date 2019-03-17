class Cade{
  stage;
  // 初始化 Stage
  stageInit() {
    const stageDom = document.querySelector("#cade-content");
    const stageWidth = stageDom.clientWidth;
    const stageHeight = stageDom.clientHeight;
    this.stage = new Konva.Stage({
      container: "cade-content",
      width: stageWidth,
      height: stageHeight
    });
  }
  // 创建矩形
  drawRect() {
    const rectGroup = new Konva.Group({
      draggable: true,
      x: 0,
      y: 0
    });
    const layer = new Konva.Layer();
    const rectText = new Konva.Text({
      x: 0,
      y: 0,
      text: "方形节点",
      width: 170,
      fontSize: 14,
      padding: 15,
      align: "center"
    });
    const rect = new Konva.Rect({
      x: 0,
      y: 0,
      width: 170,
      height: rectText.height(),
      fill: "#e7f7ff",
      stroke: "#5dafff",
      strokeWidth: 1,
      cornerRadius: 4,
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOffset: {x : 0, y : 0},
      shadowOpacity: 0.15
    });

    rectGroup.add(rect);
    rectGroup.add(rectText);
    layer.add(rectGroup);
    this.stage.add(layer);
  }
  // 绑定事件
  bindEvent(){
    const groups = this.stage.find("Group");
    groups.each(gItem => {
      gItem.off("mouseenter mouseleave");
      gItem.on("mouseenter", () => {
        this.stage.container().style.cursor = "move";
      });
      gItem.on("mouseleave", () => {
        this.stage.container().style.cursor = "default";
      });
    });
  }

}

const myCade = new Cade();
myCade.stageInit();
myCade.drawRect();
myCade.bindEvent();
