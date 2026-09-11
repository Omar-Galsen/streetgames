import Phaser from "phaser";

type SlimePlacement = { id?: number; x: number; y: number };
type SlimePlacementData = { mapWidth?: number; mapHeight?: number; slimes?: SlimePlacement[] };
type CollisionBox = { x: number; y: number; width: number; height: number };
type CollisionData = { boxes?: CollisionBox[] };

enum Direction { Down="down", Up="up", Left="left", Right="right" }

export default class HuntScene extends Phaser.Scene {
  private readonly MAP_W = 3000;
  private readonly MAP_H = 3000;
  private readonly START_X = 1715;
  private readonly START_Y = 455;
  private readonly PLAYER_SPEED = 180;
  private readonly SLIME_SPEED = 45;
  private readonly MIN_SLIMES = 5;

  private player!: Phaser.Physics.Arcade.Sprite;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private direction = Direction.Down;

  private placements: SlimePlacement[] = [];
  private slimes: (Phaser.Physics.Arcade.Sprite | null)[] = [];
  private slimeHP: number[] = [];
  private slimeAlive: boolean[] = [];
  private slimeDir: number[] = [];
  private hearts: Phaser.GameObjects.Image[][] = [];

  private rubies = 0;
  private health = 100;
  private hasSword = false;
  private attackCooldown = 0;
  private damageCooldown = 0;
  private attacking = false;
  private gameOver = false;

  private rubyText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Rectangle;

  constructor() { super("HuntScene"); }

  preload() {
    this.load.image("huntingMap", "./assets/maps/HuntingG.png");
    this.load.json("slimePlacements", "./assets/data/slime_placements.json");
    this.load.json("huntingCollisions", "./assets/data/hunting_collisions.json");
    this.load.image("heart_full", "./assets/sprites/items/heart_full.png");
    this.load.image("heart_empty", "./assets/sprites/items/heart_empty.png");

    for (let i = 1; i <= 4; i++) {
      this.load.image(`char_down_${i}`, `./assets/sprites/player/char_down_${i}.png`);
      this.load.image(`char_up_${i}`, `./assets/sprites/player/char_up_${i}.png`);
      this.load.image(`char_left_${i}`, `./assets/sprites/player/char_left_${i}.png`);
      this.load.image(`char_right_${i}`, `./assets/sprites/player/char_right_${i}.png`);
    }
    // Punch sprites (optional).
    for (let i = 1; i <= 4; i++) {
      this.load.image(`punch_down_${i}`, `./assets/sprites/player/punch/punch_down_${i}.png`);
      this.load.image(`punch_up_${i}`, `./assets/sprites/player/punch/punch_up_${i}.png`);
      this.load.image(`punch_left_${i}`, `./assets/sprites/player/punch/punch_left_${i}.png`);
      this.load.image(`punch_right_${i}`, `./assets/sprites/player/punch/punch_right_${i}.png`);
    }
    for (let i = 1; i <= 8; i++) {
      this.load.image(`sword_walk_down_${i}`, `./assets/sprites/sword/walk/sword_walk_down_${i}.png`);
      this.load.image(`sword_walk_up_${i}`, `./assets/sprites/sword/walk/sword_walk_up_${i}.png`);
      this.load.image(`sword_walk_left_${i}`, `./assets/sprites/sword/walk/sword_walk_left_${i}.png`);
      this.load.image(`sword_walk_right_${i}`, `./assets/sprites/sword/walk/sword_walk_right_${i}.png`);
      this.load.image(`sword_attack_down_${i}`, `./assets/sprites/sword/attack/sword_attack_down_${i}.png`);
      this.load.image(`sword_attack_up_${i}`, `./assets/sprites/sword/attack/sword_attack_up_${i}.png`);
      this.load.image(`sword_attack_left_${i}`, `./assets/sprites/sword/attack/sword_attack_left_${i}.png`);
      this.load.image(`sword_attack_right_${i}`, `./assets/sprites/sword/attack/sword_attack_right_${i}.png`);
    }
    for (let i = 1; i <= 8; i++) this.load.image(`slime_move_${i}`, `./assets/sprites/slimes/move/slime_move_${i}.png`);
    for (let i = 1; i <= 4; i++) this.load.image(`slime_idle_${i}`, `./assets/sprites/slimes/idle/slime_idle_${i}.png`);
  }

  create(data: { startX?: number; startY?: number } = {}) {
    const startX = Number.isFinite(data.startX) ? data.startX! : this.START_X;
    const startY = Number.isFinite(data.startY) ? data.startY! : this.START_Y;

    this.rubies = typeof this.registry.get("playerRubies") === "number" ? this.registry.get("playerRubies") : 0;
    this.health = typeof this.registry.get("playerHealth") === "number" ? this.registry.get("playerHealth") : 100;
    this.hasSword = this.registry.get("hasSword") === true;

    this.createAnimations();
    this.createSlimeAnimations();

    this.add.image(this.MAP_W / 2, this.MAP_H / 2, "huntingMap").setDisplaySize(this.MAP_W, this.MAP_H).setDepth(0);
    this.physics.world.setBounds(0, 0, this.MAP_W, this.MAP_H);
    this.createWalls();

    this.player = this.physics.add.sprite(startX, startY, this.hasSword ? "sword_walk_down_1" : "char_down_1");
    this.player.setCollideWorldBounds(true).setDepth(20);
    this.setPlayerBody();
    this.physics.add.collider(this.player, this.walls);

    const kb = this.input.keyboard;
    if (!kb) throw new Error("Keyboard input unavailable");
    this.keys = {
      w: kb.addKey("W"), a: kb.addKey("A"), s: kb.addKey("S"), d: kb.addKey("D"),
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP), down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT), right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      attack: kb.addKey(Phaser.Input.Keyboard.KeyCodes.J), exit: kb.addKey(Phaser.Input.Keyboard.KeyCodes.X), restart: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    };
    kb.resetKeys();

    const raw = this.cache.json.get("slimePlacements") as SlimePlacementData | SlimePlacement[] | null;
    this.placements = this.normalizePlacements(raw);
    this.createSlimes();
    this.createHUD();

    const cam = this.cameras.main;
    cam.stopFollow();
    cam.setBounds(0, 0, this.MAP_W, this.MAP_H);
    cam.setZoom(1);
    cam.centerOn(startX, startY);
    cam.startFollow(this.player, true, 0.15, 0.15);

    if (this.placements.length < this.MIN_SLIMES) this.showWarning();
  }

  private normalizePlacements(raw: SlimePlacementData | SlimePlacement[] | null): SlimePlacement[] {
    const list = Array.isArray(raw) ? raw : raw?.slimes;
    if (!Array.isArray(list)) return [];
    return list.filter(p => Number.isFinite(p?.x) && Number.isFinite(p?.y)).map((p, i) => ({ id: p.id ?? i + 1, x: p.x, y: p.y }));
  }

  private createWalls() {
    this.walls = this.physics.add.staticGroup();
    const raw = this.cache.json.get("huntingCollisions") as CollisionData | null;
    for (const box of raw?.boxes ?? []) {
      const w = box.width * this.MAP_W, h = box.height * this.MAP_H;
      const wall = this.walls.create(box.x * this.MAP_W + w / 2, box.y * this.MAP_H + h / 2, undefined) as Phaser.Physics.Arcade.Image;
      wall.setVisible(false).setSize(w, h).refreshBody();
    }
  }

  private createAnimations() {
    for (const d of Object.values(Direction)) {
      this.anims.create({ key: `normal_${d}`, frames: [1,2,3,4].map(i => ({ key: `char_${d}_${i}` })), frameRate: 10, repeat: -1 });
      this.anims.create({ key: `punch_${d}`, frames: [1,2].map(i => ({ key: `punch_${d}_${i}` })), frameRate: 6, repeat: 0 });
      this.anims.create({ key: `sword_walk_${d}`, frames: Array.from({length:8}, (_,i) => ({key:`sword_walk_${d}_${i+1}`})), frameRate:12, repeat:-1 });
      this.anims.create({ key: `sword_attack_${d}`, frames: Array.from({length:8}, (_,i) => ({key:`sword_attack_${d}_${i+1}`})), frameRate:20, repeat:0 });
    }
  }

  private createSlimeAnimations() {
    this.anims.create({ key:"slime_idle", frames:[1,2,3,4].map(i=>({key:`slime_idle_${i}`})), frameRate:8, repeat:-1 });
    this.anims.create({ key:"slime_move", frames:Array.from({length:8},(_,i)=>({key:`slime_move_${i+1}`})), frameRate:12, repeat:-1 });
  }

  private createSlimes() {
    for (let i=0; i<this.placements.length; i++) {
      const p = this.placements[i];
      this.slimeHP[i] = 30;
      this.slimeAlive[i] = !this.isDefeated(p.id!);
      this.slimeDir[i] = 1;
      this.hearts[i] = [];
      if (!this.slimeAlive[i]) { this.slimes[i] = null; continue; }
      const slime = this.physics.add.sprite(Phaser.Math.Clamp(p.x,35,2965), Phaser.Math.Clamp(p.y,35,2965), "slime_idle_1");
      slime.setDisplaySize(56,56).setDepth(15).setCollideWorldBounds(true);
      slime.play("slime_idle");
      this.slimes[i] = slime;
      this.createHearts(slime, i);
    }
  }

  private createHearts(slime: Phaser.GameObjects.GameObject & { x:number; y:number }, i:number) {
    for (let h=0; h<3; h++) this.hearts[i].push(this.add.image(slime.x+(h-1)*18, slime.y-42, "heart_full").setDisplaySize(16,16).setDepth(30));
  }

  private updateHearts(i:number) {
    const slime=this.slimes[i]; if(!slime) return;
    this.hearts[i].forEach((h,n)=>{ h.setPosition(slime.x+(n-1)*18,slime.y-42); h.setTexture(this.slimeHP[i]>n*10?"heart_full":"heart_empty"); });
  }

  update(_time:number, delta:number) {
    if (this.gameOver) { if (Phaser.Input.Keyboard.JustDown(this.keys.restart)) this.restart(); return; }
    this.attackCooldown -= delta; this.damageCooldown -= delta;

    let dx=0,dy=0;
    if(this.keys.w.isDown||this.keys.up.isDown){dy=-1;this.direction=Direction.Up;}
    if(this.keys.s.isDown||this.keys.down.isDown){dy=1;this.direction=Direction.Down;}
    if(this.keys.a.isDown||this.keys.left.isDown){dx=-1;this.direction=Direction.Left;}
    if(this.keys.d.isDown||this.keys.right.isDown){dx=1;this.direction=Direction.Right;}
    if(dx&&dy){const n=Math.SQRT1_2;dx*=n;dy*=n;}
    this.player.setVelocity(dx*this.PLAYER_SPEED,dy*this.PLAYER_SPEED);
    if(!this.attacking){ if(dx||dy) this.playWalk(); else this.stopWalk(); }

    this.updateSlimes(delta);
    this.damageFromSlimes();
    if(Phaser.Input.Keyboard.JustDown(this.keys.attack)) this.attack();
    if(Phaser.Input.Keyboard.JustDown(this.keys.exit)) this.returnToShop();
  }

  private playWalk(){ const key=this.hasSword?`sword_walk_${this.direction}`:`normal_${this.direction}`; if(this.player.anims.currentAnim?.key!==key) this.player.play(key,true); }
  private stopWalk(){ this.player.anims.stop(); this.player.setTexture(this.hasSword?`sword_walk_${this.direction}_1`:`char_${this.direction}_1`); this.setPlayerBody(); }
  private setPlayerBody(){ const s=this.player.texture.getSourceImage(); this.player.setScale(72/s.height); const b=this.player.body as Phaser.Physics.Arcade.Body; b.setSize(this.player.displayWidth*.55,this.player.displayHeight*.7); b.setOffset(this.player.displayWidth*.225,this.player.displayHeight*.25); }

  private updateSlimes(delta:number){
    for(let i=0;i<this.slimes.length;i++){
      const slime=this.slimes[i],p=this.placements[i]; if(!slime||!this.slimeAlive[i]) continue;
      const top=p.y-50,bottom=p.y+50;
      slime.y += this.slimeDir[i]*this.SLIME_SPEED*delta/1000;
      if(slime.y>=bottom){slime.y=bottom;this.slimeDir[i]=-1;} if(slime.y<=top){slime.y=top;this.slimeDir[i]=1;}
      if(slime.anims.currentAnim?.key!=="slime_move") slime.play("slime_move");
      this.updateHearts(i);
    }
  }

  private attack(){
    if(this.attackCooldown>0||this.attacking)return;
    this.attackCooldown=350;
    this.attacking=true;

    if(this.hasSword){
      this.player.play(`sword_attack_${this.direction}`);
      this.time.delayedCall(120,()=>this.hitNearest(30));
      this.time.delayedCall(400,()=>{this.attacking=false;if(this.player?.active)this.stopWalk();});
      return;
    }

    // No sword: J is a punch. Each punch deals 5 damage.
    // With 30 HP total and 3 hearts, that removes half of one heart.
    this.playPunchAttack();
    this.time.delayedCall(330,()=>{ if (this.scene.isActive("HuntScene") && this.player?.active) this.hitNearest(5); });
    this.time.delayedCall(700,()=>{this.attacking=false;if(this.player?.active)this.stopWalk();});
  }

  private playPunchAttack(){
    const key=`punch_${this.direction}`;
    if(this.anims.exists(key)) this.player.play(key,true);
  }

  private hitNearest(damage:number){
    let best=-1,dist=Infinity;
    for(let i=0;i<this.slimes.length;i++){const s=this.slimes[i];if(!s||!this.slimeAlive[i])continue;const d=Phaser.Math.Distance.Between(this.player.x,this.player.y,s.x,s.y);if(d<dist){dist=d;best=i;}}
    if(best>=0&&dist<=110){this.slimeHP[best]-=damage;this.updateHearts(best);if(this.slimeHP[best]<=0)this.killSlime(best);}
  }

  private killSlime(i:number){
    const s=this.slimes[i]; if(!s)return; this.slimeAlive[i]=false; this.markDefeated(this.placements[i].id!); this.rubies+=20; this.registry.set("playerRubies",this.rubies); this.rubyText.setText(`♦ Rubies: ${this.rubies}`); this.hearts[i].forEach(h=>h.destroy()); this.hearts[i]=[]; s.destroy(); this.slimes[i]=null;
  }

  private damageFromSlimes(){
    if(this.damageCooldown>0)return;
    for(let i=0;i<this.slimes.length;i++){const s=this.slimes[i];if(!s||!this.slimeAlive[i])continue;if(Phaser.Math.Distance.Between(this.player.x,this.player.y,s.x,s.y)<=70){this.health=Math.max(0,this.health-10);this.registry.set("playerHealth",this.health);this.damageCooldown=900;this.updateHealth();if(this.health<=0)this.showGameOver();return;}}
  }

  private isDefeated(id:number){return this.registry.get(`slimeDefeated_${id}`)===true || (id===1&&this.registry.get("slimeDefeated")===true) || (id===2&&this.registry.get("slime2Defeated")===true);}
  private markDefeated(id:number){this.registry.set(`slimeDefeated_${id}`,true);if(id===1)this.registry.set("slimeDefeated",true);if(id===2)this.registry.set("slime2Defeated",true);}

  private returnToShop(){ this.registry.set("playerHealth",this.health);this.registry.set("playerRubies",this.rubies);this.registry.set("hasSword",this.hasSword);this.scene.start("GameScene"); }
  private restart(){this.registry.set("playerHealth",100);this.scene.start("GameScene");}

  private createHUD(){
    const panel=this.add.rectangle(18,18,270,105,0x111827,.94).setOrigin(0).setScrollFactor(0).setDepth(100);
    panel.setStrokeStyle(2,0xc9a227,1);
    this.add.text(32,28,"HUNTING AREA",{fontSize:"18px",fontStyle:"bold",color:"#fff"}).setScrollFactor(0).setDepth(101);
    this.healthBar=this.add.rectangle(32,58,220,14,0xdc2626).setOrigin(0).setScrollFactor(0).setDepth(101);
    this.healthText=this.add.text(32,78,"100 / 100 HP",{fontSize:"14px",color:"#fff"}).setScrollFactor(0).setDepth(101);
    this.rubyText=this.add.text(145,28,`♦ Rubies: ${this.rubies}`,{fontSize:"16px",color:"#f5d76e"}).setScrollFactor(0).setDepth(101);
    this.updateHealth();
  }
  private updateHealth(){this.healthBar.setDisplaySize(220*(this.health/100),14);this.healthText.setText(`${this.health} / 100 HP`);}

  private showWarning(){this.add.text(500,650,`Editor slimes loaded: ${this.placements.length}. Add at least ${this.MIN_SLIMES} slimes.`,{fontSize:"18px",color:"#f5d76e",backgroundColor:"#111827",padding:{x:12,y:8}}).setOrigin(.5).setScrollFactor(0).setDepth(200);}
  private showGameOver(){if(this.gameOver)return;this.gameOver=true;this.player.setVelocity(0,0);this.add.rectangle(500,350,1000,700,0x000000,.78).setScrollFactor(0).setDepth(1000);this.add.text(500,300,"GAME OVER",{fontSize:"52px",fontStyle:"bold",color:"#f5d76e"}).setOrigin(.5).setScrollFactor(0).setDepth(1001);this.add.text(500,380,"Press SPACE to return to the shop",{fontSize:"22px",color:"#fff"}).setOrigin(.5).setScrollFactor(0).setDepth(1001);}
}

