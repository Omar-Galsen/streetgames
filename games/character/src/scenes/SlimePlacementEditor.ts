import Phaser from "phaser";

type SlimePlacement = { id: number; x: number; y: number };

type SlimePlacementData = {
  mapWidth: number;
  mapHeight: number;
  coordinateMode: "world";
  slimes: SlimePlacement[];
};

/**
 * Standalone development editor for placing slimes on HuntingG.png.
 * This scene is NOT part of the normal game.
 *
 * Controls:
 *   Left click empty map = add slime
 *   Left drag slime      = move slime
 *   Mouse wheel          = zoom
 *   Middle drag          = pan
 *   Delete               = delete selected slime
 *   S                    = save slime_placements.json
 *   R                    = reload/reset from saved JSON
 */
export default class SlimePlacementEditor extends Phaser.Scene {
  private readonly MAP_WIDTH = 3000;
  private readonly MAP_HEIGHT = 3000;

  private map!: Phaser.GameObjects.Image;
  private slimes: Phaser.Physics.Arcade.Sprite[] = [];
  private selectedSlime?: Phaser.Physics.Arcade.Sprite;

  private draggingSlime = false;
  private panning = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private panLastX = 0;
  private panLastY = 0;
  private nextId = 1;

  private statusText!: Phaser.GameObjects.Text;
  private coordinateText!: Phaser.GameObjects.Text;
  private countText!: Phaser.GameObjects.Text;

  constructor() {
    super("SlimePlacementEditor");
  }

  preload() {
    this.load.image("huntingMap", "./assets/maps/HuntingG.png");

    for (let i = 1; i <= 4; i++) {
      this.load.image(
        `slime_idle_${i}`,
        `./assets/sprites/slimes/idle/slime_idle_${i}.png`
      );
    }

    this.load.json(
      "slimePlacements",
      "./assets/data/slime_placements.json"
    );
  }

  create() {
    this.createAnimations();

    this.map = this.add
      .image(0, 0, "huntingMap")
      .setOrigin(0, 0)
      .setDisplaySize(this.MAP_WIDTH, this.MAP_HEIGHT)
      .setDepth(0);

    this.physics.world.setBounds(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT);
    this.cameras.main.setBounds(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT);

    // Start with the complete 3000x3000 map visible.
    // The minimum zoom is intentionally much smaller so the map can
    // be zoomed farther out when needed.
    const initialZoom = 0.22;
    this.cameras.main.setZoom(initialZoom);
    this.cameras.main.centerOn(this.MAP_WIDTH / 2, this.MAP_HEIGHT / 2);

    this.createUI();
    this.loadPlacements();

    this.input.on("pointerdown", this.pointerDown, this);
    this.input.on("pointermove", this.pointerMove, this);
    this.input.on("pointerup", this.pointerUp, this);
    this.input.on("wheel", this.mouseWheel, this);

    this.input.keyboard?.on("keydown-DELETE", this.deleteSelected, this);
    this.input.keyboard?.on("keydown-S", this.savePlacements, this);
    this.input.keyboard?.on("keydown-R", this.loadPlacements, this);
    this.input.keyboard?.on("keydown-MINUS", this.zoomOut, this);
    this.input.keyboard?.on("keydown-NUMPADMINUS", this.zoomOut, this);
    this.input.keyboard?.on("keydown-PLUS", this.zoomIn, this);
    this.input.keyboard?.on("keydown-NUMPADPLUS", this.zoomIn, this);
    this.input.keyboard?.on("keydown-ONE", this.resetZoom, this);
  }

  private createAnimations() {
    if (this.anims.exists("editor_slime_idle")) return;

    this.anims.create({
      key: "editor_slime_idle",
      frames: Array.from({ length: 4 }, (_, i) => ({
        key: `slime_idle_${i + 1}`,
      })),
      frameRate: 8,
      repeat: -1,
    });
  }

  private createUI() {
    const panel = this.add
      .rectangle(10, 10, 390, 130, 0x111827, 0.94)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(1000)
      .setStrokeStyle(2, 0xc9a227, 1);

    this.add
      .text(24, 20, "SLIME PLACEMENT EDITOR", {
        fontFamily: "Arial",
        fontSize: "21px",
        fontStyle: "bold",
        color: "#f5d76e",
      })
      .setScrollFactor(0)
      .setDepth(1001);

    this.add
      .text(24, 51, "Click = add   Drag = move   Wheel = zoom", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#ffffff",
      })
      .setScrollFactor(0)
      .setDepth(1001);

    this.add
      .text(24, 73, "Middle mouse = pan   Delete = remove   S = save", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#ffffff",
      })
      .setScrollFactor(0)
      .setDepth(1001);

    this.statusText = this.add
      .text(24, 96, "Loading placements...", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#d1d5db",
      })
      .setScrollFactor(0)
      .setDepth(1001);

    this.coordinateText = this.add
      .text(24, 117, "Selected: none", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#9ca3af",
      })
      .setScrollFactor(0)
      .setDepth(1001);

    this.countText = this.add
      .text(850, 15, "Slimes: 0", {
        fontFamily: "Arial",
        fontSize: "17px",
        fontStyle: "bold",
        color: "#ffffff",
        backgroundColor: "#111827",
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      })
      .setScrollFactor(0)
      .setDepth(1001);

    void panel;
  }

  private loadPlacements() {
    for (const slime of this.slimes) slime.destroy();
    this.slimes = [];
    this.selectedSlime = undefined;
    this.nextId = 1;

    const data = this.cache.json.get("slimePlacements") as
      | SlimePlacementData
      | null;

    if (data && Array.isArray(data.slimes)) {
      for (const placement of data.slimes) {
        this.createEditorSlime(placement.id, placement.x, placement.y);
      }

      this.nextId =
        data.slimes.reduce((max, slime) => Math.max(max, slime.id), 0) + 1;

      this.statusText.setText(
        `${data.slimes.length} slime(s) loaded. Place or drag them on HuntingG.png.`
      );
    } else {
      this.statusText.setText(
        "No saved placements. Click the map to place a slime."
      );
    }

    this.updateUI();
  }

  private createEditorSlime(id: number, x: number, y: number) {
    const slime = this.physics.add
      .sprite(
        Phaser.Math.Clamp(x, 35, this.MAP_WIDTH - 35),
        Phaser.Math.Clamp(y, 35, this.MAP_HEIGHT - 35),
        "slime_idle_1"
      )
      .setDisplaySize(70, 70)
      .setDepth(20)
      .setInteractive();

    slime.setData("slimeId", id);
    slime.play("editor_slime_idle");
    this.slimes.push(slime);
  }

  private pointerDown(pointer: Phaser.Input.Pointer) {
    if (pointer.middleButtonDown()) {
      this.panning = true;
      this.panLastX = pointer.x;
      this.panLastY = pointer.y;
      return;
    }

    if (!pointer.leftButtonDown()) return;

    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    const hit = this.slimes
      .filter((slime) => slime.active)
      .find(
        (slime) =>
          Phaser.Math.Distance.Between(world.x, world.y, slime.x, slime.y) <=
          55
      );

    if (hit) {
      this.selectedSlime = hit;
      this.draggingSlime = true;
      this.dragOffsetX = hit.x - world.x;
      this.dragOffsetY = hit.y - world.y;
      hit.setScale(1.18);
      this.statusText.setText(
        `Moving Slime #${hit.getData("slimeId")}`
      );
      this.updateUI();
      return;
    }

    // Clicking empty map space creates a slime exactly at that world coordinate.
    const id = this.nextId++;
    this.createEditorSlime(id, world.x, world.y);
    this.selectedSlime = this.slimes[this.slimes.length - 1];
    this.statusText.setText(`Added Slime #${id}. Drag to fine-tune it.`);
    this.updateUI();
  }

  private pointerMove(pointer: Phaser.Input.Pointer) {
    if (this.panning) {
      const dx = pointer.x - this.panLastX;
      const dy = pointer.y - this.panLastY;
      const zoom = this.cameras.main.zoom || 1;
      this.cameras.main.scrollX -= dx / zoom;
      this.cameras.main.scrollY -= dy / zoom;
      this.panLastX = pointer.x;
      this.panLastY = pointer.y;
      return;
    }

    if (!this.draggingSlime || !this.selectedSlime) return;

    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.selectedSlime.x = Phaser.Math.Clamp(
      world.x + this.dragOffsetX,
      35,
      this.MAP_WIDTH - 35
    );
    this.selectedSlime.y = Phaser.Math.Clamp(
      world.y + this.dragOffsetY,
      35,
      this.MAP_HEIGHT - 35
    );

    this.updateUI();
  }

  private pointerUp() {
    if (this.selectedSlime) this.selectedSlime.setScale(1);
    this.draggingSlime = false;
    this.panning = false;
  }

  private mouseWheel(
    pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _dx: number,
    dy: number
  ) {
    const before = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const currentZoom = this.cameras.main.zoom;
    const nextZoom = Phaser.Math.Clamp(
      currentZoom * (dy > 0 ? 0.85 : 1.18),
      0.05,
      2.5
    );

    this.cameras.main.setZoom(nextZoom);

    const after = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.cameras.main.scrollX += before.x - after.x;
    this.cameras.main.scrollY += before.y - after.y;
  }

  private deleteSelected() {
    if (!this.selectedSlime) return;

    const id = this.selectedSlime.getData("slimeId");
    this.selectedSlime.destroy();
    this.slimes = this.slimes.filter((slime) => slime.active);
    this.selectedSlime = undefined;
    this.statusText.setText(`Deleted Slime #${id}.`);
    this.updateUI();
  }

  private updateUI() {
    this.countText?.setText(`Slimes: ${this.slimes.filter((s) => s.active).length}`);

    if (!this.coordinateText) return;

    if (!this.selectedSlime || !this.selectedSlime.active) {
      this.coordinateText.setText("Selected: none");
      return;
    }

    const id = this.selectedSlime.getData("slimeId");
    this.coordinateText.setText(
      `Slime #${id}: X ${Math.round(this.selectedSlime.x)}, Y ${Math.round(
        this.selectedSlime.y
      )}`
    );
  }

  private savePlacements() {
    const slimes = this.slimes
      .filter((slime) => slime.active)
      .map((slime) => ({
        id: Number(slime.getData("slimeId")),
        x: Math.round(slime.x),
        y: Math.round(slime.y),
      }))
      .sort((a, b) => a.id - b.id);

    const data: SlimePlacementData = {
      mapWidth: this.MAP_WIDTH,
      mapHeight: this.MAP_HEIGHT,
      coordinateMode: "world",
      slimes,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "slime_placements.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    this.statusText.setText(`Saved ${slimes.length} slime(s).`);
  }

  private zoomOut() {
    this.setZoomAroundCenter(
      Phaser.Math.Clamp(this.cameras.main.zoom * 0.8, 0.05, 2.5)
    );
  }

  private zoomIn() {
    this.setZoomAroundCenter(
      Phaser.Math.Clamp(this.cameras.main.zoom * 1.25, 0.05, 2.5)
    );
  }

  private resetZoom() {
    this.setZoomAroundCenter(0.22);
  }

  private setZoomAroundCenter(nextZoom: number) {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    const before = this.cameras.main.getWorldPoint(centerX, centerY);

    this.cameras.main.setZoom(nextZoom);

    const after = this.cameras.main.getWorldPoint(centerX, centerY);
    this.cameras.main.scrollX += before.x - after.x;
    this.cameras.main.scrollY += before.y - after.y;

    this.cameras.main.scrollX = Phaser.Math.Clamp(
      this.cameras.main.scrollX,
      0,
      Math.max(0, this.MAP_WIDTH - this.scale.width / nextZoom)
    );
    this.cameras.main.scrollY = Phaser.Math.Clamp(
      this.cameras.main.scrollY,
      0,
      Math.max(0, this.MAP_HEIGHT - this.scale.height / nextZoom)
    );

    this.statusText.setText(
      `Zoom: ${Math.round(nextZoom * 100)}%`
    );
  }
}
