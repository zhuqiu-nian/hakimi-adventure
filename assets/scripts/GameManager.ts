import {
    _decorator,
    Button,
    Color,
    Component,
    EventKeyboard,
    Input,
    input,
    KeyCode,
    Label,
    Node,
    Rect,
    resources,
    Sprite,
    SpriteFrame,
    sys,
    tween,
    UITransform,
    Vec3,
} from 'cc';
import { Collectible, CollectibleKind } from './Collectible';
import { FeedbackManager } from './FeedbackManager';
import { GameHud, HudIconFrames, HudSaveView, PowerState, SkinView, UpgradeLevels } from './GameHud';
import { Obstacle, ObstaclePassType } from './Obstacle';
import { ParallaxLayer } from './ParallaxLayer';
import { RunnerController } from './RunnerController';
import { WorldScroller } from './WorldScroller';

const { ccclass, property } = _decorator;

type GameState = 'menu' | 'settings' | 'upgrade' | 'playing' | 'pause' | 'gameover';
type ObstacleKind = 'mushroom' | 'cactus' | 'crate' | 'spikes' | 'lowSign' | 'hangingBell';
type PowerKind = keyof PowerState;
type SkinId = 'classic' | 'berry' | 'mint';
type CoinPatternKind = 'cat' | 'dog' | 'fish' | 'paw' | 'heart';

type CoursePattern = {
    length: number;
    minDistance?: number;
    obstacles?: Array<{ x: number; kind: ObstacleKind }>;
    coinArcs?: Array<{ x: number; y: number; count?: number }>;
    coinPatterns?: Array<{ x: number; y: number; kind: CoinPatternKind }>;
    powers?: Array<{ x: number; y: number; kind: CollectibleKind }>;
};

type TextureSet = {
    seamlessBg: SpriteFrame;
    sky: SpriteFrame;
    mountains: SpriteFrame;
    city: SpriteFrame;
    ground: SpriteFrame;
    foregroundDeco: SpriteFrame;
    runner: SpriteFrame;
    runnerRun: SpriteFrame[];
    runnerJump: SpriteFrame[];
    runnerFall: SpriteFrame;
    runnerGlide: SpriteFrame[];
    runnerSlide: SpriteFrame[];
    runnerPower: Record<PowerKind, SpriteFrame>;
    coin: SpriteFrame;
    diamond: SpriteFrame;
    magnet: SpriteFrame;
    shield: SpriteFrame;
    scoreStar: SpriteFrame;
    dash: SpriteFrame;
    magnetFx: SpriteFrame;
    shieldFx: SpriteFrame;
    scoreFx: SpriteFrame;
    dashFx: SpriteFrame;
    mushroom: SpriteFrame;
    cactus: SpriteFrame;
    crate: SpriteFrame;
    spikes: SpriteFrame;
    lowSign: SpriteFrame;
    hangingBell: SpriteFrame;
    button: SpriteFrame;
    panel: SpriteFrame;
    badge: SpriteFrame;
    logo: SpriteFrame;
};

type GameSave = {
    bestScore: number;
    totalCoins: number;
    selectedSkin: SkinId;
    unlockedSkins: SkinId[];
    upgrades: UpgradeLevels;
    missionsCompleted: number;
};

const POWER_KINDS: PowerKind[] = ['magnet', 'shield', 'score', 'dash'];
const POWER_NAMES: Record<PowerKind, string> = {
    magnet: '\u78c1\u94c1',
    shield: '\u62a4\u76fe',
    score: '\u53cc\u500d',
    dash: '\u51b2\u523a',
};
const DEFAULT_UPGRADES: UpgradeLevels = { magnet: 1, shield: 1, score: 1, dash: 1 };
const UPGRADE_BASE_COST: Record<PowerKind, number> = { magnet: 80, shield: 90, score: 110, dash: 130 };
const MAX_UPGRADE_LEVEL = 5;
const SKINS: Array<{ id: SkinId; label: string; cost: number; color: Color }> = [
    { id: 'classic', label: '\u7ecf\u5178\u54c8\u57fa\u7c73', cost: 0, color: new Color(255, 255, 255, 255) },
    { id: 'berry', label: '\u8349\u8393\u54c8\u57fa\u7c73', cost: 160, color: new Color(255, 214, 226, 255) },
    { id: 'mint', label: '\u8584\u8377\u54c8\u57fa\u7c73', cost: 220, color: new Color(213, 255, 233, 255) },
];

const DEFAULT_SAVE: GameSave = {
    bestScore: 0,
    totalCoins: 0,
    selectedSkin: 'classic',
    unlockedSkins: ['classic'],
    upgrades: { ...DEFAULT_UPGRADES },
    missionsCompleted: 0,
};

@ccclass('GameManager')
export class GameManager extends Component {
    @property
    public baseSpeed = 430;

    @property
    public maxSpeed = 970;

    @property
    public speedGain = 12.5;

    private state: GameState = 'menu';
    private textures: TextureSet | null = null;
    private worldRoot: Node | null = null;
    private obstacleRoot: Node | null = null;
    private itemRoot: Node | null = null;
    private feedbackRoot: Node | null = null;
    private player: Node | null = null;
    private playerFxRoot: Node | null = null;
    private runner: RunnerController | null = null;
    private hud: GameHud | null = null;
    private feedback: FeedbackManager | null = null;
    private powerFxNodes: Partial<Record<PowerKind, Node>> = {};
    private groundScroller: WorldScroller | null = null;
    private parallaxLayers: ParallaxLayer[] = [];
    private obstacles: Obstacle[] = [];
    private collectibles: Collectible[] = [];
    private powers: PowerState = { magnet: 0, shield: 0, score: 0, dash: 0 };
    private speed = 0;
    private distance = 0;
    private runCoins = 0;
    private score = 0;
    private combo = 0;
    private comboTimer = 0;
    private dodges = 0;
    private nextSpawnX = 720;
    private spaceHeld = false;
    private touchHeld = false;
    private saveData: GameSave = { ...DEFAULT_SAVE, upgrades: { ...DEFAULT_UPGRADES }, unlockedSkins: ['classic'] };
    private readonly surfaceY = -238;
    private readonly playerGroundY = -184;
    private readonly playerX = -430;
    private readonly missionCoins = 40;
    private readonly missionDistance = 600;
    private readonly missionDodges = 8;
    private readonly patternGapMin = 220;
    private readonly patternGapMax = 420;
    private readonly samePatternJitter = 80;
    private readonly minObstacleGap = 260;
    private readonly saveKey = 'hakimi_adventure_save_v2';
    private readonly oldBestKey = 'hakimi_adventure_best_score';
    private readonly coursePatterns: CoursePattern[] = [
        { length: 620, obstacles: [{ x: 230, kind: 'mushroom' }], coinArcs: [{ x: 360, y: 158, count: 5 }], coinPatterns: [{ x: 470, y: 230, kind: 'paw' }] },
        { length: 680, obstacles: [{ x: 270, kind: 'spikes' }], coinArcs: [{ x: 90, y: 104, count: 5 }, { x: 430, y: 178, count: 5 }], powers: [{ x: 580, y: 208, kind: 'magnet' }] },
        { length: 700, obstacles: [{ x: 300, kind: 'crate' }], coinArcs: [{ x: 110, y: 115, count: 5 }], coinPatterns: [{ x: 440, y: 230, kind: 'heart' }], powers: [{ x: 610, y: 212, kind: 'magnet' }] },
        { length: 740, minDistance: 260, obstacles: [{ x: 280, kind: 'cactus' }], coinArcs: [{ x: 80, y: 125, count: 4 }, { x: 450, y: 230, count: 6 }], powers: [{ x: 640, y: 230, kind: 'shield' }] },
        { length: 780, minDistance: 520, obstacles: [{ x: 300, kind: 'lowSign' }], coinPatterns: [{ x: 470, y: 160, kind: 'fish' }] },
        { length: 860, minDistance: 760, obstacles: [{ x: 220, kind: 'mushroom' }, { x: 560, kind: 'spikes' }], coinArcs: [{ x: 350, y: 220, count: 6 }] },
        { length: 900, minDistance: 980, obstacles: [{ x: 240, kind: 'crate' }, { x: 610, kind: 'cactus' }], coinPatterns: [{ x: 410, y: 250, kind: 'cat' }], powers: [{ x: 720, y: 260, kind: 'score' }] },
        { length: 900, minDistance: 1200, obstacles: [{ x: 260, kind: 'hangingBell' }, { x: 650, kind: 'mushroom' }], coinArcs: [{ x: 145, y: 105, count: 4 }, { x: 510, y: 230, count: 5 }] },
        { length: 940, minDistance: 1500, obstacles: [{ x: 270, kind: 'mushroom' }, { x: 650, kind: 'spikes' }], coinArcs: [{ x: 130, y: 150, count: 5 }], coinPatterns: [{ x: 690, y: 235, kind: 'dog' }], powers: [{ x: 480, y: 238, kind: 'dash' }] },
        { length: 980, minDistance: 1800, obstacles: [{ x: 260, kind: 'cactus' }, { x: 690, kind: 'hangingBell' }], coinArcs: [{ x: 430, y: 210, count: 7 }], powers: [{ x: 790, y: 255, kind: 'shield' }] },
        { length: 1020, minDistance: 2150, obstacles: [{ x: 250, kind: 'crate' }, { x: 620, kind: 'spikes' }, { x: 930, kind: 'mushroom' }], coinArcs: [{ x: 110, y: 120, count: 5 }, { x: 720, y: 240, count: 5 }] },
        { length: 1040, minDistance: 2500, obstacles: [{ x: 280, kind: 'spikes' }, { x: 690, kind: 'cactus' }], coinArcs: [{ x: 430, y: 250, count: 7 }], powers: [{ x: 860, y: 245, kind: 'score' }] },
        { length: 1080, minDistance: 2900, obstacles: [{ x: 260, kind: 'lowSign' }, { x: 670, kind: 'crate' }], coinArcs: [{ x: 390, y: 165, count: 5 }, { x: 820, y: 235, count: 6 }] },
        { length: 1120, minDistance: 3300, obstacles: [{ x: 300, kind: 'cactus' }, { x: 760, kind: 'cactus' }], coinArcs: [{ x: 130, y: 110, count: 4 }, { x: 560, y: 245, count: 6 }], powers: [{ x: 920, y: 245, kind: 'dash' }] },
        { length: 1180, minDistance: 3800, obstacles: [{ x: 260, kind: 'crate' }, { x: 680, kind: 'spikes' }, { x: 1010, kind: 'lowSign' }], coinArcs: [{ x: 470, y: 220, count: 6 }, { x: 860, y: 160, count: 5 }] },
        { length: 1240, minDistance: 4300, obstacles: [{ x: 280, kind: 'lowSign' }, { x: 720, kind: 'mushroom' }, { x: 1080, kind: 'crate' }], coinArcs: [{ x: 130, y: 105, count: 4 }, { x: 840, y: 260, count: 7 }], powers: [{ x: 1040, y: 245, kind: 'magnet' }] },
    ];

    public async start(): Promise<void> {
        this.saveData = this.loadSave();
        this.textures = await this.loadTextures();
        this.buildScene();
        this.bindInput();
        this.showMenu();
    }

    public onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
        input.off(Input.EventType.TOUCH_START, this.onPressStart, this);
        input.off(Input.EventType.TOUCH_END, this.onPressEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onPressEnd, this);
        input.off(Input.EventType.MOUSE_DOWN, this.onPressStart, this);
        input.off(Input.EventType.MOUSE_UP, this.onPressEnd, this);
    }

    public update(dt: number): void {
        if (!this.textures || !this.runner) {
            return;
        }
        const running = this.state === 'playing';
        if (running && (this.spaceHeld || this.touchHeld)) {
            this.runner.startGlide();
        }
        this.runner.tick(dt, running);
        if (!running) {
            return;
        }

        this.tickPowers(dt);
        this.updatePowerEffects(dt);
        const dashBoost = this.powers.dash > 0 ? 1.55 : 1;
        this.speed = Math.min(this.maxSpeed, this.speed + this.speedGain * dt);
        const activeSpeed = this.speed * dashBoost;
        const multiplier = this.currentMultiplier();
        this.distance += activeSpeed * dt * 0.03;
        this.score += activeSpeed * dt * 0.09 * multiplier;
        this.comboTimer = Math.max(0, this.comboTimer - dt);
        if (this.comboTimer <= 0) {
            this.combo = 0;
        }

        for (const layer of this.parallaxLayers) {
            layer.tick(dt, activeSpeed);
        }
        this.groundScroller?.scroll(dt, activeSpeed);
        this.scrollDynamicNodes(dt, activeSpeed);
        this.applyMagnet(dt);
        this.spawnWhileNeeded();
        this.checkCollectibles();
        this.checkObstacles();
        this.updateHud();
    }

    private buildScene(): void {
        if (!this.textures) {
            return;
        }
        this.node.removeAllChildren();
        this.parallaxLayers.length = 0;
        this.worldRoot = this.makeNode('World', this.node, Vec3.ZERO);

        const bgRoot = this.makeNode('Parallax', this.worldRoot, Vec3.ZERO);
        this.createParallaxLayer(bgRoot, 'SeamlessKawaiiBackground', this.textures.seamlessBg, 0.12, 1280, 720, 0);
        this.createDecorLayer(bgRoot);

        const groundLayer = this.makeNode('GroundLayer', this.worldRoot, new Vec3(0, this.surfaceY - 46, 0));
        this.groundScroller = groundLayer.addComponent(WorldScroller);
        this.groundScroller.speedMultiplier = 1;
        this.groundScroller.wrapWidth = 1280;
        for (let i = 0; i < 9; i++) {
            this.makeSprite(`Ground_${i}`, groundLayer, this.textures.ground, 365, 92, new Vec3(-730 + i * 365, 0, 0));
        }

        this.obstacleRoot = this.makeNode('Obstacles', this.worldRoot, Vec3.ZERO);
        this.itemRoot = this.makeNode('CollectiblesAndPowerups', this.worldRoot, Vec3.ZERO);
        this.player = this.makeSprite('HakimiRunner', this.worldRoot, this.textures.runner, 210, 210, new Vec3(this.playerX, this.playerGroundY, 0));
        this.playerFxRoot = this.makeNode('PlayerFxRoot', this.player, Vec3.ZERO);
        this.buildPlayerEffects();
        const playerSprite = this.player.getComponent(Sprite);
        this.runner = this.player.addComponent(RunnerController);
        this.runner.groundY = this.playerGroundY;
        this.runner.jumpVelocity = 1190;
        this.runner.doubleJumpVelocity = 1060;
        if (playerSprite) {
            this.runner.setupAnimation(
                playerSprite,
                this.textures.runnerRun,
                this.textures.runnerJump,
                this.textures.runnerSlide,
                this.textures.runnerFall,
                this.textures.runnerGlide,
            );
        }
        this.applySelectedSkin();

        const uiRoot = this.makeNode('UIRoot', this.node, Vec3.ZERO);
        this.hud = uiRoot.addComponent(GameHud);
        const icons: HudIconFrames = {
            coin: this.textures.coin,
            diamond: this.textures.diamond,
            magnet: this.textures.magnet,
            shield: this.textures.shield,
            scoreStar: this.textures.scoreStar,
            dash: this.textures.dash,
            badge: this.textures.badge,
        };
        this.hud.build(this.textures.button, this.textures.panel, this.textures.logo, icons);
        this.feedbackRoot = this.makeNode('FeedbackRoot', uiRoot, Vec3.ZERO);
        this.feedback = this.feedbackRoot.addComponent(FeedbackManager);
        this.feedback.setup(this.textures.coin);
        this.bindHudButtons();
        this.makeLabel('VersionLabel', 'Demo v1 - Cocos Creator 3.8.8', 18, new Vec3(465, -328, 0), new Color(105, 119, 132, 190), uiRoot);
    }

    private buildPlayerEffects(): void {
        if (!this.textures || !this.playerFxRoot) {
            return;
        }
        this.powerFxNodes = {
            magnet: this.makeSprite('MagnetFx', this.playerFxRoot, this.textures.magnetFx, 220, 220, new Vec3(0, 4, 0)),
            shield: this.makeSprite('ShieldFx', this.playerFxRoot, this.textures.shieldFx, 198, 198, new Vec3(0, 2, 0)),
            dash: this.makeSprite('DashFx', this.playerFxRoot, this.textures.dashFx, 260, 128, new Vec3(-94, -8, 0)),
            score: this.makeSprite('ScoreFx', this.playerFxRoot, this.textures.scoreFx, 206, 206, new Vec3(0, 8, 0)),
        };
        for (const kind of POWER_KINDS) {
            const node = this.powerFxNodes[kind];
            if (node) {
                node.active = false;
            }
        }
    }

    private createDecorLayer(parent: Node): void {
        if (!this.textures) {
            return;
        }
        const layer = this.makeNode('ForegroundDecor', parent, new Vec3(0, this.surfaceY + 38, 0));
        const parallax = layer.addComponent(ParallaxLayer);
        parallax.ratio = 0.42;
        parallax.wrapWidth = 1280;
        this.parallaxLayers.push(parallax);
        for (let i = 0; i < 8; i++) {
            const y = i % 2 === 0 ? 4 : 22;
            this.makeSprite(`Decor_${i}`, layer, this.textures.foregroundDeco, 156, 108, new Vec3(-680 + i * 230, y, 0));
        }
    }

    private bindHudButtons(): void {
        const addButton = (node: Node | null, callback: () => void): void => {
            if (!node) {
                return;
            }
            const button = node.addComponent(Button);
            button.transition = Button.Transition.SCALE;
            node.on(Node.EventType.TOUCH_END, callback, this);
        };
        addButton(this.hud?.getStartNode() ?? null, this.onStartPressed);
        addButton(this.hud?.getSettingsNode() ?? null, this.onSettingsPressed);
        addButton(this.hud?.getUpgradeNode() ?? null, this.onUpgradePressed);
        addButton(this.hud?.getPauseNode() ?? null, this.onPausePressed);
        addButton(this.hud?.getContinueNode() ?? null, this.onContinuePressed);
        addButton(this.hud?.getMenuNode() ?? null, this.onMenuPressed);
        addButton(this.hud?.getSettingsBackNode() ?? null, this.onBackPressed);
        addButton(this.hud?.getUpgradeBackNode() ?? null, this.onBackPressed);
        addButton(this.hud?.getRetryNode() ?? null, this.onStartPressed);
        addButton(this.hud?.getResultMenuNode() ?? null, this.onMenuPressed);
        addButton(this.hud?.getResultShopNode() ?? null, this.onUpgradePressed);
        for (const kind of POWER_KINDS) {
            addButton(this.hud?.getUpgradeButton(kind) ?? null, () => this.buyUpgrade(kind));
        }
        for (const skin of SKINS) {
            addButton(this.hud?.getSkinButton(skin.id) ?? null, () => this.selectSkin(skin.id));
        }
    }

    private createParallaxLayer(parent: Node, name: string, frame: SpriteFrame, ratio: number, width: number, height: number, y: number): void {
        const layer = this.makeNode(name, parent, new Vec3(0, y, 0));
        const parallax = layer.addComponent(ParallaxLayer);
        parallax.ratio = ratio;
        parallax.wrapWidth = 1280;
        this.parallaxLayers.push(parallax);
        this.makeSprite(`${name}_A`, layer, frame, width, height, new Vec3(0, 0, 0));
        this.makeSprite(`${name}_B`, layer, frame, width, height, new Vec3(width, 0, 0));
    }

    private resetRunData(): void {
        this.speed = this.baseSpeed;
        this.distance = 0;
        this.runCoins = 0;
        this.score = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.dodges = 0;
        this.nextSpawnX = 700;
        this.spaceHeld = false;
        this.touchHeld = false;
        this.powers = { magnet: 0, shield: 0, score: 0, dash: 0 };
        this.updatePowerEffects(0);
        this.obstacles.length = 0;
        this.collectibles.length = 0;
        this.obstacleRoot?.removeAllChildren();
        this.itemRoot?.removeAllChildren();
        this.runner?.reset(this.playerX);
        this.updateHud();
    }

    private showMenu(): void {
        this.state = 'menu';
        this.resetRunData();
        this.hud?.setMenu(this.saveView(), this.skinViews());
    }

    private showSettings(): void {
        this.state = 'settings';
        this.hud?.setSettings();
    }

    private showUpgrade(): void {
        this.state = 'upgrade';
        this.hud?.setUpgrade(this.saveView(), this.skinViews(), this.upgradeCosts());
    }

    private startRun(): void {
        if (this.state === 'playing') {
            return;
        }
        this.resetRunData();
        this.spawnInitialCourse();
        this.state = 'playing';
        this.hud?.setPlaying();
        this.feedback?.showText('\u51fa\u53d1\uff01', new Vec3(0, 20, 0), new Color(255, 152, 84, 255), 34);
    }

    private pauseRun(): void {
        if (this.state !== 'playing') {
            return;
        }
        this.state = 'pause';
        this.hud?.setPause();
    }

    private resumeRun(): void {
        if (this.state !== 'pause') {
            return;
        }
        this.state = 'playing';
        this.hud?.setPlaying();
    }

    private gameOver(): void {
        if (this.state !== 'playing') {
            return;
        }
        this.state = 'gameover';
        const finalScore = Math.floor(this.score);
        const missionDone = this.isMissionDone();
        const reward = this.runCoins + Math.floor(this.distance / 120) + (missionDone ? 25 : 0);
        this.saveData.totalCoins += reward;
        if (finalScore > this.saveData.bestScore) {
            this.saveData.bestScore = finalScore;
        }
        if (missionDone) {
            this.saveData.missionsCompleted += 1;
        }
        this.saveGame();
        this.hud?.setGameOver(finalScore, this.runCoins, this.saveData.totalCoins, this.distance, missionDone, reward);
        this.feedback?.shake(this.worldRoot, 12);
        if (this.player) {
            tween(this.player)
                .to(0.12, { scale: new Vec3(1.25, 0.75, 1) })
                .to(0.18, { scale: new Vec3(1, 1, 1) })
                .start();
        }
    }

    private spawnInitialCourse(): void {
        for (let i = 0; i < 4; i++) {
            this.spawnCoinArc(250 + i * 260, 110 + (i % 2) * 42);
        }
        this.spawnPowerup(560, 'magnet', 170);
        this.spawnPowerup(880, 'shield', 190);
        this.spawnPowerup(1180, 'score', 170);
        this.nextSpawnX = 1280;
        this.spawnWhileNeeded();
    }

    private spawnWhileNeeded(): void {
        while (this.nextSpawnX < 1480) {
            const pattern = this.pickCoursePattern();
            const baseX = this.nextSpawnX;
            let previousObstacleX = -Infinity;
            for (const obstacle of pattern.obstacles ?? []) {
                const jitter = this.randomRange(-this.samePatternJitter, this.samePatternJitter);
                const localX = Math.max(obstacle.x + jitter, previousObstacleX + this.minObstacleGap);
                previousObstacleX = localX;
                this.spawnObstacle(baseX + localX, obstacle.kind);
            }
            for (const arc of pattern.coinArcs ?? []) {
                this.spawnCoinArc(baseX + arc.x, arc.y, arc.count);
            }
            for (const coinPattern of pattern.coinPatterns ?? []) {
                this.spawnCoinPattern(baseX + coinPattern.x, this.surfaceY + coinPattern.y, coinPattern.kind);
            }
            for (const power of pattern.powers ?? []) {
                this.spawnPowerup(baseX + power.x, power.kind, power.y);
            }
            this.nextSpawnX += pattern.length + this.randomRange(this.patternGapMin, this.patternGapMax);
        }
    }

    private spawnObstacle(x: number, kind: ObstacleKind): void {
        if (!this.textures || !this.obstacleRoot) {
            return;
        }
        const data = {
            mushroom: { frame: this.textures.mushroom, width: 88, height: 80, y: this.surfaceY + 40, padX: 18, padY: 16, passType: 'jump' as ObstaclePassType },
            cactus: { frame: this.textures.cactus, width: 76, height: 86, y: this.surfaceY + 43, padX: 16, padY: 12, passType: 'jump' as ObstaclePassType },
            crate: { frame: this.textures.crate, width: 90, height: 76, y: this.surfaceY + 38, padX: 16, padY: 12, passType: 'jump' as ObstaclePassType },
            spikes: { frame: this.textures.spikes, width: 92, height: 54, y: this.surfaceY + 27, padX: 14, padY: 9, passType: 'jump' as ObstaclePassType },
            lowSign: { frame: this.textures.lowSign, width: 142, height: 74, y: this.surfaceY + 142, padX: 18, padY: 14, passType: 'slide' as ObstaclePassType },
            hangingBell: { frame: this.textures.hangingBell, width: 164, height: 102, y: this.surfaceY + 166, padX: 20, padY: 16, passType: 'slide' as ObstaclePassType },
        }[kind];
        const node = this.makeSprite(`Obstacle_${kind}`, this.obstacleRoot, data.frame, data.width, data.height, new Vec3(x, data.y, 0));
        const obstacle = node.addComponent(Obstacle);
        obstacle.hitPaddingX = data.padX;
        obstacle.hitPaddingY = data.padY;
        obstacle.passType = data.passType;
        this.obstacles.push(obstacle);
    }

    private spawnCoinArc(x: number, y: number, explicitCount?: number): void {
        const count = explicitCount ?? (5 + Math.floor(Math.random() * 2));
        const safeCount = Math.max(2, count);
        for (let i = 0; i < safeCount; i++) {
            const offsetY = Math.sin((i / (safeCount - 1)) * Math.PI) * 56;
            this.spawnCollectible(x + i * 44, this.surfaceY + y + offsetY, 'coin');
        }
    }

    private spawnCoinPattern(x: number, y: number, kind: CoinPatternKind): void {
        const maps: Record<CoinPatternKind, number[][]> = {
            cat: [
                [1, 0], [4, 0],
                [0, 1], [2, 1], [3, 1], [5, 1],
                [0, 2], [5, 2],
                [1, 3], [2, 3], [3, 3], [4, 3],
            ],
            dog: [
                [0, 0], [5, 0],
                [0, 1], [1, 1], [4, 1], [5, 1],
                [1, 2], [2, 2], [3, 2], [4, 2],
                [2, 3], [3, 3],
            ],
            fish: [
                [0, 1], [1, 0], [1, 2],
                [2, 0], [2, 1], [2, 2],
                [3, 1], [4, 0], [4, 2],
            ],
            paw: [
                [1, 0], [3, 0],
                [0, 1], [2, 1], [4, 1],
                [1, 3], [2, 2], [3, 3],
            ],
            heart: [
                [1, 0], [3, 0],
                [0, 1], [2, 1], [4, 1],
                [1, 2], [3, 2],
                [2, 3],
            ],
        };
        const points = maps[kind];
        const step = 38;
        const width = Math.max(...points.map((point) => point[0])) * step;
        const height = Math.max(...points.map((point) => point[1])) * step;
        for (const [gridX, gridY] of points) {
            this.spawnCollectible(x + gridX * step - width * 0.5, y - gridY * step + height * 0.5, 'coin');
        }
    }

    private spawnPowerup(x: number, kind: CollectibleKind, yFromGround: number): void {
        if (kind === 'coin') {
            return;
        }
        this.spawnCollectible(x, this.surfaceY + yFromGround, kind);
    }

    private spawnCollectible(x: number, y: number, kind: CollectibleKind): void {
        if (!this.textures || !this.itemRoot) {
            return;
        }
        const frame = this.frameForCollectible(kind);
        const size = kind === 'coin' ? 10 : 13;
        const node = this.makeSprite(kind === 'coin' ? 'Coin' : `Power_${kind}`, this.itemRoot, frame, size, size, new Vec3(x, y, 0));
        const collectible = node.addComponent(Collectible);
        collectible.kind = kind;
        collectible.value = kind === 'coin' ? 1 : 0;
        collectible.reset();
        this.collectibles.push(collectible);
        if (kind !== 'coin') {
            node.angle = Math.random() * 8 - 4;
        }
    }

    private scrollDynamicNodes(dt: number, speed: number): void {
        const dx = speed * dt;
        for (const root of [this.obstacleRoot, this.itemRoot]) {
            if (!root) {
                continue;
            }
            for (const child of root.children) {
                const pos = child.position.clone();
                pos.x -= dx;
                child.setPosition(pos);
            }
        }
        this.nextSpawnX -= dx;
        this.obstacleRoot?.children.filter((node) => node.position.x <= -820).forEach((node) => node.destroy());
        this.itemRoot?.children.filter((node) => node.position.x <= -820 || !node.active).forEach((node) => node.destroy());
        this.obstacles = this.obstacles.filter((item) => item.node.isValid && item.node.position.x > -780);
        this.collectibles = this.collectibles.filter((item) => item.node.isValid && item.node.position.x > -780 && item.node.active);
    }

    private applyMagnet(dt: number): void {
        if (!this.player || this.powers.magnet <= 0) {
            return;
        }
        const playerPos = this.player.position;
        for (const item of this.collectibles) {
            if (!item.node.active || item.kind !== 'coin') {
                continue;
            }
            const pos = item.node.position.clone();
            const dx = playerPos.x - pos.x;
            const dy = playerPos.y + 20 - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 330 + this.saveData.upgrades.magnet * 18) {
                pos.x += dx * Math.min(1, dt * 8.5);
                pos.y += dy * Math.min(1, dt * 8.5);
                item.node.setPosition(pos);
            }
        }
    }

    private checkCollectibles(): void {
        const playerBox = this.getPlayerHitBox();
        for (const collectible of this.collectibles) {
            if (!collectible.node.active || !playerBox.intersects(collectible.getHitBox())) {
                continue;
            }
            const itemPos = collectible.node.position.clone();
            if (collectible.kind === 'coin') {
                const value = collectible.collect();
                this.runCoins += value;
                this.combo += value;
                this.comboTimer = 2.2;
                this.score += (100 + Math.min(300, this.combo * 8)) * value * this.currentMultiplier();
                this.feedback?.showCoin(itemPos, value);
            } else {
                collectible.collect();
                this.activatePower(collectible.kind);
                this.feedback?.showText(`${this.powerName(collectible.kind)}!`, itemPos, new Color(106, 166, 214, 255), 28);
            }
        }
    }

    private checkObstacles(): void {
        const playerBox = this.getPlayerHitBox();
        for (const obstacle of this.obstacles) {
            if (!obstacle.node.active) {
                continue;
            }
            if (!obstacle.passed && obstacle.node.position.x < this.playerX - 84) {
                obstacle.passed = true;
                this.combo += 2;
                this.comboTimer = 2.2;
                this.dodges += 1;
                this.score += 80 * this.currentMultiplier();
                this.feedback?.showText('\u5b8c\u7f8e\u8d8a\u8fc7 +80', new Vec3(this.playerX + 30, this.playerGroundY + 116, 0), new Color(255, 152, 84, 255), 24);
                continue;
            }
            if (!playerBox.intersects(obstacle.getHitBox())) {
                continue;
            }
            if (obstacle.passType === 'slide' && this.runner?.isSliding) {
                continue;
            }
            if (this.powers.dash > 0) {
                this.score += 180 * this.currentMultiplier();
                obstacle.node.active = false;
                this.feedback?.showText('\u51b2\u7834\u969c\u788d +180', obstacle.node.position.clone().add(new Vec3(0, 60, 0)), new Color(113, 142, 236, 255), 24);
                continue;
            }
            if (this.powers.shield > 0) {
                this.powers.shield = 0;
                obstacle.node.active = false;
                this.flashPlayer();
                this.feedback?.shake(this.worldRoot, 8);
                this.feedback?.showText('\u62a4\u76fe\u62b5\u6321', obstacle.node.position.clone().add(new Vec3(0, 60, 0)), new Color(74, 145, 226, 255), 26);
                continue;
            }
            this.gameOver();
            return;
        }
    }

    private getPlayerHitBox(): Rect {
        if (!this.player) {
            return new Rect();
        }
        const transform = this.player.getComponent(UITransform);
        const size = transform ? transform.contentSize : { width: 110, height: 110 };
        const pos = this.player.worldPosition;
        const sliding = this.runner?.isSliding ?? false;
        const width = size.width * 0.56;
        const height = size.height * (sliding ? 0.4 : 0.66);
        const yOffset = sliding ? -height * 0.25 : 0;
        return new Rect(pos.x - width * 0.5, pos.y - height * 0.5 + yOffset, width, height);
    }

    private activatePower(kind: CollectibleKind): void {
        if (kind === 'coin') {
            return;
        }
        const duration = this.powerDuration(kind);
        this.powers[kind] = Math.max(this.powers[kind], duration);
        this.flashPlayer();
        if (this.textures) {
            this.runner?.playSpecial(this.textures.runnerPower[kind], 0.38);
        }
        this.feedback?.showPulse(this.frameForCollectible(kind), new Vec3(this.playerX, this.playerGroundY + 72, 0), this.powerColor(kind), 120);
    }

    private tickPowers(dt: number): void {
        for (const kind of POWER_KINDS) {
            this.powers[kind] = Math.max(0, this.powers[kind] - dt);
        }
    }

    private updatePowerEffects(dt: number): void {
        for (const kind of POWER_KINDS) {
            const node = this.powerFxNodes[kind];
            if (!node) {
                continue;
            }
            const active = this.powers[kind] > 0;
            node.active = active;
            if (!active) {
                continue;
            }
            if (kind === 'magnet' || kind === 'score') {
                node.angle += (kind === 'magnet' ? 70 : -50) * dt;
            }
            const pulse = 1 + Math.sin(Date.now() * 0.008) * (kind === 'shield' ? 0.045 : 0.07);
            node.setScale(pulse, pulse, 1);
        }
    }

    private currentMultiplier(): number {
        const distanceBonus = 1 + Math.min(3, Math.floor(this.distance / 450) * 0.25);
        const scoreBonus = this.powers.score > 0 ? 2 : 1;
        const missionBonus = this.saveData.missionsCompleted > 0 ? Math.min(0.5, this.saveData.missionsCompleted * 0.05) : 0;
        return distanceBonus * scoreBonus + this.comboMultiplierBonus() + missionBonus;
    }

    private comboMultiplierBonus(): number {
        if (this.combo < 10) return 0;
        if (this.combo < 20) return 0.25;
        if (this.combo < 35) return 0.5;
        return 1;
    }

    private updateHud(): void {
        this.hud?.updateStats({
            distance: this.distance,
            runCoins: this.runCoins,
            totalCoins: this.saveData.totalCoins,
            score: this.score,
            bestScore: this.saveData.bestScore,
            multiplier: this.currentMultiplier(),
            combo: this.combo,
            missionText: this.missionText(),
        });
        this.hud?.updatePowers(this.powers, this.powerMaxState());
    }

    private pickCoursePattern(): CoursePattern {
        const available = this.coursePatterns.filter((pattern) => this.distance >= (pattern.minDistance ?? 0));
        return available[Math.floor(Math.random() * available.length)] ?? this.coursePatterns[0];
    }

    private randomRange(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }

    private frameForCollectible(kind: CollectibleKind): SpriteFrame {
        if (!this.textures) {
            throw new Error('Textures are not loaded');
        }
        if (kind === 'magnet') return this.textures.magnet;
        if (kind === 'shield') return this.textures.shield;
        if (kind === 'score') return this.textures.scoreStar;
        if (kind === 'dash') return this.textures.dash;
        return this.textures.coin;
    }

    private flashPlayer(): void {
        if (!this.player) {
            return;
        }
        tween(this.player)
            .to(0.08, { scale: new Vec3(1.18, 1.18, 1) })
            .to(0.12, { scale: new Vec3(1, 1, 1) })
            .start();
    }

    private bindInput(): void {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
        input.on(Input.EventType.TOUCH_START, this.onPressStart, this);
        input.on(Input.EventType.TOUCH_END, this.onPressEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onPressEnd, this);
        input.on(Input.EventType.MOUSE_DOWN, this.onPressStart, this);
        input.on(Input.EventType.MOUSE_UP, this.onPressEnd, this);
    }

    private onKeyDown(event: EventKeyboard): void {
        if (event.keyCode === KeyCode.SPACE || event.keyCode === KeyCode.KEY_W || event.keyCode === KeyCode.ARROW_UP) {
            this.spaceHeld = true;
            if (this.state === 'playing') {
                if (this.runner?.isAirborne) {
                    this.runner.startGlide();
                } else {
                    this.runner?.jump();
                }
            }
        }
        if (event.keyCode === KeyCode.ARROW_DOWN || event.keyCode === KeyCode.KEY_S) {
            if (this.state === 'playing') {
                this.runner?.slide();
            }
        }
        if (event.keyCode === KeyCode.KEY_P) {
            if (this.state === 'playing') {
                this.pauseRun();
            } else if (this.state === 'pause') {
                this.resumeRun();
            }
        }
        if (event.keyCode === KeyCode.ENTER && this.state !== 'playing' && this.state !== 'pause') {
            this.startRun();
        }
        if (event.keyCode === KeyCode.ESCAPE) {
            if (this.state === 'settings' || this.state === 'upgrade') {
                this.showMenu();
            } else if (this.state === 'pause') {
                this.resumeRun();
            }
        }
    }

    private onKeyUp(event: EventKeyboard): void {
        if (event.keyCode === KeyCode.SPACE || event.keyCode === KeyCode.KEY_W || event.keyCode === KeyCode.ARROW_UP) {
            this.spaceHeld = false;
            this.runner?.stopGlide();
        }
    }

    private onPressStart(): void {
        this.touchHeld = true;
        if (this.state === 'playing') {
            if (this.runner?.isAirborne) {
                this.runner.startGlide();
            } else {
                this.runner?.jump();
            }
        }
    }

    private onPressEnd(): void {
        this.touchHeld = false;
        this.runner?.stopGlide();
    }

    private onStartPressed(): void { this.startRun(); }
    private onSettingsPressed(): void { this.showSettings(); }
    private onUpgradePressed(): void { this.showUpgrade(); }
    private onPausePressed(): void { this.pauseRun(); }
    private onContinuePressed(): void { this.resumeRun(); }
    private onMenuPressed(): void { this.showMenu(); }
    private onBackPressed(): void { this.showMenu(); }

    private buyUpgrade(kind: PowerKind): void {
        if (this.state !== 'upgrade') {
            return;
        }
        const level = this.saveData.upgrades[kind];
        if (level >= MAX_UPGRADE_LEVEL) {
            this.feedback?.showText('\u5df2\u6ee1\u7ea7', new Vec3(0, -120, 0), new Color(106, 166, 214, 255), 28);
            return;
        }
        const cost = this.upgradeCost(kind);
        if (this.saveData.totalCoins < cost) {
            this.feedback?.showText('\u91d1\u5e01\u4e0d\u8db3', new Vec3(0, -120, 0), new Color(219, 102, 64, 255), 28);
            return;
        }
        this.saveData.totalCoins -= cost;
        this.saveData.upgrades[kind] += 1;
        this.saveGame();
        this.feedback?.showText(`${this.powerName(kind)} Lv.${this.saveData.upgrades[kind]}`, new Vec3(0, -120, 0), new Color(255, 152, 84, 255), 28);
        this.hud?.setUpgrade(this.saveView(), this.skinViews(), this.upgradeCosts());
    }

    private selectSkin(id: SkinId): void {
        if (this.state !== 'upgrade') {
            return;
        }
        const skin = SKINS.find((item) => item.id === id);
        if (!skin) {
            return;
        }
        if (this.saveData.unlockedSkins.indexOf(id) < 0) {
            if (this.saveData.totalCoins < skin.cost) {
                this.feedback?.showText('\u91d1\u5e01\u4e0d\u8db3', new Vec3(0, -120, 0), new Color(219, 102, 64, 255), 28);
                return;
            }
            this.saveData.totalCoins -= skin.cost;
            this.saveData.unlockedSkins.push(id);
        }
        this.saveData.selectedSkin = id;
        this.applySelectedSkin();
        this.saveGame();
        this.feedback?.showText('\u76ae\u80a4\u5df2\u5207\u6362', new Vec3(0, -120, 0), new Color(255, 152, 84, 255), 28);
        this.hud?.setUpgrade(this.saveView(), this.skinViews(), this.upgradeCosts());
    }

    private applySelectedSkin(): void {
        const sprite = this.player?.getComponent(Sprite);
        const skin = SKINS.find((item) => item.id === this.saveData.selectedSkin) ?? SKINS[0];
        if (sprite) {
            sprite.color = skin.color;
        }
    }

    private powerDuration(kind: PowerKind): number {
        const level = this.saveData.upgrades[kind];
        if (kind === 'magnet') return 8 + level * 1.7;
        if (kind === 'shield') return 8 + level * 1.6;
        if (kind === 'score') return 8 + level * 1.35;
        return 2.7 + level * 0.42;
    }

    private powerMaxState(): PowerState {
        return {
            magnet: this.powerDuration('magnet'),
            shield: this.powerDuration('shield'),
            score: this.powerDuration('score'),
            dash: this.powerDuration('dash'),
        };
    }

    private powerName(kind: CollectibleKind): string {
        if (kind === 'coin') {
            return '\u91d1\u5e01';
        }
        return POWER_NAMES[kind];
    }

    private powerColor(kind: PowerKind): Color {
        if (kind === 'magnet') return new Color(237, 70, 62, 220);
        if (kind === 'shield') return new Color(74, 145, 226, 220);
        if (kind === 'score') return new Color(255, 202, 53, 220);
        return new Color(113, 142, 236, 220);
    }

    private upgradeCost(kind: PowerKind): number {
        const level = this.saveData.upgrades[kind];
        if (level >= MAX_UPGRADE_LEVEL) {
            return 0;
        }
        return UPGRADE_BASE_COST[kind] + (level - 1) * 70;
    }

    private upgradeCosts(): Record<PowerKind, number> {
        return {
            magnet: this.upgradeCost('magnet'),
            shield: this.upgradeCost('shield'),
            score: this.upgradeCost('score'),
            dash: this.upgradeCost('dash'),
        };
    }

    private saveView(): HudSaveView {
        return {
            totalCoins: this.saveData.totalCoins,
            selectedSkin: this.saveData.selectedSkin,
            upgrades: { ...this.saveData.upgrades },
        };
    }

    private skinViews(): SkinView[] {
        return SKINS.map((skin) => ({
            id: skin.id,
            label: skin.label,
            selected: this.saveData.selectedSkin === skin.id,
            unlocked: this.saveData.unlockedSkins.indexOf(skin.id) >= 0,
            cost: skin.cost,
            color: skin.color,
        }));
    }

    private isMissionDone(): boolean {
        return this.runCoins >= this.missionCoins || this.distance >= this.missionDistance || this.dodges >= this.missionDodges;
    }

    private missionText(): string {
        if (this.isMissionDone()) {
            return '\u4efb\u52a1\u5b8c\u6210: \u7ed3\u7b97 +25 \u91d1\u5e01';
        }
        return `\u4efb\u52a1: ${this.runCoins}/${this.missionCoins}\u91d1\u5e01  ${Math.floor(this.distance)}/${this.missionDistance}m  ${this.dodges}/${this.missionDodges}\u8d8a\u8fc7`;
    }

    private loadSave(): GameSave {
        const raw = sys.localStorage.getItem(this.saveKey);
        let parsed: Partial<GameSave> | null = null;
        if (raw) {
            try {
                parsed = JSON.parse(raw) as Partial<GameSave>;
            } catch {
                parsed = null;
            }
        }
        const oldBest = Number(sys.localStorage.getItem(this.oldBestKey) ?? 0);
        const unlocked = parsed?.unlockedSkins?.filter((id): id is SkinId => id === 'classic' || id === 'berry' || id === 'mint') ?? ['classic'];
        if (unlocked.indexOf('classic') < 0) {
            unlocked.push('classic');
        }
        const selected = parsed?.selectedSkin === 'berry' || parsed?.selectedSkin === 'mint' || parsed?.selectedSkin === 'classic'
            ? parsed.selectedSkin
            : 'classic';
        return {
            bestScore: Math.max(oldBest, Number(parsed?.bestScore ?? 0)),
            totalCoins: Math.max(0, Math.floor(Number(parsed?.totalCoins ?? 0))),
            selectedSkin: unlocked.indexOf(selected) >= 0 ? selected : 'classic',
            unlockedSkins: unlocked,
            upgrades: {
                magnet: this.saneLevel(parsed?.upgrades?.magnet),
                shield: this.saneLevel(parsed?.upgrades?.shield),
                score: this.saneLevel(parsed?.upgrades?.score),
                dash: this.saneLevel(parsed?.upgrades?.dash),
            },
            missionsCompleted: Math.max(0, Math.floor(Number(parsed?.missionsCompleted ?? 0))),
        };
    }

    private saneLevel(value: unknown): number {
        return Math.max(1, Math.min(MAX_UPGRADE_LEVEL, Math.floor(Number(value ?? 1))));
    }

    private saveGame(): void {
        sys.localStorage.setItem(this.saveKey, JSON.stringify(this.saveData));
    }

    private async loadTextures(): Promise<TextureSet> {
        const [
            seamlessBg,
            sky,
            mountains,
            city,
            ground,
            foregroundDeco,
            runner,
            runnerRun0,
            runnerRun1,
            runnerRun2,
            runnerRun3,
            runnerJump0,
            runnerJump1,
            runnerFall,
            runnerGlideStart,
            runnerGlide,
            runnerGlideEnd,
            runnerSlideStart,
            runnerSlideLoop,
            runnerSlideEnd,
            runnerPowerMagnet,
            runnerPowerShield,
            runnerPowerDash,
            runnerPowerScore,
            coin,
            diamond,
            magnet,
            shield,
            scoreStar,
            dash,
            magnetFx,
            shieldFx,
            scoreFx,
            dashFx,
            mushroom,
            cactus,
            crate,
            spikes,
            lowSign,
            hangingBell,
            button,
            panel,
            badge,
            logo,
        ] = await Promise.all([
            this.loadSpriteFrame('textures/world/seamless_bg'),
            this.loadSpriteFrame('textures/world/sky'),
            this.loadSpriteFrame('textures/world/mountains'),
            this.loadSpriteFrame('textures/world/city'),
            this.loadSpriteFrame('textures/world/ground_tile'),
            this.loadSpriteFrame('textures/world/foreground_deco'),
            this.loadSpriteFrame('textures/runner/runner'),
            this.loadSpriteFrame('textures/runner/runner_run_0'),
            this.loadSpriteFrame('textures/runner/runner_run_1'),
            this.loadSpriteFrame('textures/runner/runner_run_2'),
            this.loadSpriteFrame('textures/runner/runner_run_3'),
            this.loadSpriteFrame('textures/runner/runner_jump_0'),
            this.loadSpriteFrame('textures/runner/runner_jump_1'),
            this.loadSpriteFrame('textures/runner/runner_fall_0'),
            this.loadSpriteFrame('textures/runner/runner_glide_start'),
            this.loadSpriteFrame('textures/runner/runner_glide'),
            this.loadSpriteFrame('textures/runner/runner_glide_end'),
            this.loadSpriteFrame('textures/runner/runner_slide_start'),
            this.loadSpriteFrame('textures/runner/runner_slide'),
            this.loadSpriteFrame('textures/runner/runner_slide_end'),
            this.loadSpriteFrame('textures/runner/runner_power_magnet'),
            this.loadSpriteFrame('textures/runner/runner_power_shield'),
            this.loadSpriteFrame('textures/runner/runner_power_dash'),
            this.loadSpriteFrame('textures/runner/runner_power_score'),
            this.loadSpriteFrame('textures/items/coin'),
            this.loadSpriteFrame('textures/items/diamond'),
            this.loadSpriteFrame('textures/items/magnet'),
            this.loadSpriteFrame('textures/items/shield'),
            this.loadSpriteFrame('textures/items/score_star'),
            this.loadSpriteFrame('textures/items/dash'),
            this.loadSpriteFrame('textures/items/magnet_fx'),
            this.loadSpriteFrame('textures/items/shield_fx'),
            this.loadSpriteFrame('textures/items/score_fx'),
            this.loadSpriteFrame('textures/items/dash_fx'),
            this.loadSpriteFrame('textures/items/mushroom'),
            this.loadSpriteFrame('textures/items/cactus'),
            this.loadSpriteFrame('textures/items/crate'),
            this.loadSpriteFrame('textures/items/spikes'),
            this.loadSpriteFrame('textures/items/low_sign'),
            this.loadSpriteFrame('textures/items/hanging_bell'),
            this.loadSpriteFrame('textures/ui/button'),
            this.loadSpriteFrame('textures/ui/panel'),
            this.loadSpriteFrame('textures/ui/badge'),
            this.loadSpriteFrame('textures/ui/main_logo'),
        ]);
        return {
            seamlessBg,
            sky,
            mountains,
            city,
            ground,
            foregroundDeco,
            runner,
            runnerRun: [runnerRun0, runnerRun1, runnerRun2, runnerRun1],
            runnerJump: [runnerJump0, runnerJump1],
            runnerFall,
            runnerGlide: [runnerGlideStart, runnerGlide],
            runnerSlide: [runnerSlideStart, runnerSlideLoop, runnerSlideEnd],
            runnerPower: {
                magnet: runnerPowerMagnet,
                shield: runnerPowerShield,
                dash: runnerPowerDash,
                score: runnerPowerScore,
            },
            coin,
            diamond,
            magnet,
            shield,
            scoreStar,
            dash,
            magnetFx,
            shieldFx,
            scoreFx,
            dashFx,
            mushroom,
            cactus,
            crate,
            spikes,
            lowSign,
            hangingBell,
            button,
            panel,
            badge,
            logo,
        };
    }

    private loadSpriteFrame(path: string): Promise<SpriteFrame> {
        return new Promise((resolve, reject) => {
            resources.load(`${path}/spriteFrame`, SpriteFrame, (error, frame) => {
                if (error || !frame) {
                    reject(error ?? new Error(`Missing sprite frame: ${path}`));
                    return;
                }
                resolve(frame);
            });
        });
    }

    private makeNode(name: string, parent: Node, pos: Vec3): Node {
        const node = new Node(name);
        parent.addChild(node);
        node.setPosition(pos);
        return node;
    }

    private makeSprite(name: string, parent: Node, frame: SpriteFrame, width: number, height: number, pos: Vec3): Node {
        const node = this.makeNode(name, parent, pos);
        const transform = node.addComponent(UITransform);
        transform.setContentSize(width, height);
        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = frame;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        return node;
    }

    private makeLabel(name: string, text: string, fontSize: number, pos: Vec3, color: Color, parent: Node): Label {
        const node = this.makeNode(name, parent, pos);
        const transform = node.addComponent(UITransform);
        transform.setContentSize(420, fontSize + 12);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 8;
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        return label;
    }
}
