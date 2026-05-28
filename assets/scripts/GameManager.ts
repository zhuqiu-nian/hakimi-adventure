import {
    _decorator,
    Button,
    Color,
    Component,
    EventKeyboard,
    Font,
    Graphics,
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
import { AchievementView, GameHud, GameOverView, HudIconFrames, HudSaveView, LeaderboardEntryView, MissionView, PowerState, SkinView, UpgradeLevels } from './GameHud';
import { Obstacle, ObstaclePassType } from './Obstacle';
import { ParallaxLayer } from './ParallaxLayer';
import { RunnerController } from './RunnerController';
import { AudioManager } from './AudioManager';
import { WorldScroller } from './WorldScroller';

const { ccclass, property } = _decorator;

type GameState = 'menu' | 'settings' | 'upgrade' | 'playing' | 'pause' | 'revive' | 'gameover';
type ObstacleKind = 'mushroom' | 'cactus' | 'crate' | 'spikes' | 'lowSign' | 'hangingBell';
type PowerKind = keyof PowerState;
type SkinId = 'classic' | 'berry' | 'mint';
type CoinPatternKind = 'cat' | 'bigCat' | 'dog' | 'fish' | 'paw' | 'heart' | 'star' | 'crown' | 'smile' | 'house';
type MissionId = 'coins' | 'distance' | 'dodges';
type AchievementId = 'first1k' | 'coinCollector' | 'combo20' | 'shieldGuard';

type MissileThreat = {
    warningNode: Node;
    missileNode: Node | null;
    trailNode: Node | null;
    y: number;
    state: 'warning' | 'flying';
    timer: number;
    warningDuration: number;
    speed: number;
    hit: boolean;
};

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
    missile: SpriteFrame;
    missileTrail: SpriteFrame;
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
    pauseIcon: SpriteFrame;
    uiFont: Font;
};

type GameSave = {
    bestScore: number;
    totalCoins: number;
    selectedSkin: SkinId;
    unlockedSkins: SkinId[];
    upgrades: UpgradeLevels;
    missionsCompleted: number;
    leaderboard: LeaderboardEntry[];
    achievements: Partial<Record<AchievementId, boolean>>;
};

type LeaderboardEntry = {
    score: number;
    distance: number;
    coins: number;
    date: string;
};

type MissionDefinition = {
    id: MissionId;
    label: string;
    target: number;
    reward: number;
};

type AchievementDefinition = {
    id: AchievementId;
    label: string;
    reward: number;
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
const MISSION_DEFS: MissionDefinition[] = [
    { id: 'coins', label: '\u91d1\u5e01', target: 40, reward: 18 },
    { id: 'distance', label: '\u91cc\u7a0b', target: 600, reward: 18 },
    { id: 'dodges', label: '\u8d8a\u8fc7', target: 8, reward: 20 },
];
const ACHIEVEMENT_DEFS: AchievementDefinition[] = [
    { id: 'first1k', label: '\u9996\u6b21 1000m', reward: 50 },
    { id: 'coinCollector', label: '\u7d2f\u8ba1 500 \u91d1\u5e01', reward: 80 },
    { id: 'combo20', label: '\u5355\u5c40 20 \u8fde\u51fb', reward: 45 },
    { id: 'shieldGuard', label: '\u62a4\u76fe\u62b5\u6321 3 \u6b21', reward: 45 },
];

const DEFAULT_SAVE: GameSave = {
    bestScore: 0,
    totalCoins: 0,
    selectedSkin: 'classic',
    unlockedSkins: ['classic'],
    upgrades: { ...DEFAULT_UPGRADES },
    missionsCompleted: 0,
    leaderboard: [],
    achievements: {},
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
    private missileRoot: Node | null = null;
    private feedbackRoot: Node | null = null;
    private player: Node | null = null;
    private playerFxRoot: Node | null = null;
    private runner: RunnerController | null = null;
    private hud: GameHud | null = null;
    private feedback: FeedbackManager | null = null;
    private audioManager: AudioManager | null = null;
    private powerFxNodes: Partial<Record<PowerKind, Node>> = {};
    private groundScroller: WorldScroller | null = null;
    private parallaxLayers: ParallaxLayer[] = [];
    private obstacles: Obstacle[] = [];
    private collectibles: Collectible[] = [];
    private missiles: MissileThreat[] = [];
    private powers: PowerState = { magnet: 0, shield: 0, score: 0, dash: 0 };
    private speed = 0;
    private distance = 0;
    private runCoins = 0;
    private score = 0;
    private combo = 0;
    private maxCombo = 0;
    private comboTimer = 0;
    private dodges = 0;
    private shieldBlocks = 0;
    private reviveUsed = false;
    private nextSpawnX = 720;
    private missileCooldown = 0;
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
    private readonly missileUnlockDistance = 900;
    private readonly missileBaseCooldown = 7.4;
    private readonly saveKey = 'hakimi_adventure_save_v2';
    private readonly oldBestKey = 'hakimi_adventure_best_score';
    private readonly coursePatterns: CoursePattern[] = [
        { length: 620, obstacles: [{ x: 230, kind: 'mushroom' }], coinArcs: [{ x: 360, y: 158, count: 5 }], coinPatterns: [{ x: 470, y: 230, kind: 'paw' }] },
        { length: 680, obstacles: [{ x: 270, kind: 'spikes' }], coinArcs: [{ x: 90, y: 104, count: 5 }, { x: 430, y: 178, count: 5 }], powers: [{ x: 580, y: 208, kind: 'magnet' }] },
        { length: 700, obstacles: [{ x: 300, kind: 'crate' }], coinArcs: [{ x: 110, y: 115, count: 5 }], coinPatterns: [{ x: 440, y: 230, kind: 'heart' }], powers: [{ x: 610, y: 212, kind: 'magnet' }] },
        { length: 740, minDistance: 260, obstacles: [{ x: 280, kind: 'cactus' }], coinArcs: [{ x: 80, y: 125, count: 4 }], coinPatterns: [{ x: 470, y: 238, kind: 'star' }], powers: [{ x: 640, y: 230, kind: 'shield' }] },
        { length: 780, minDistance: 520, obstacles: [{ x: 300, kind: 'lowSign' }], coinPatterns: [{ x: 470, y: 160, kind: 'fish' }] },
        { length: 860, minDistance: 760, obstacles: [{ x: 220, kind: 'mushroom' }, { x: 560, kind: 'spikes' }], coinArcs: [{ x: 350, y: 220, count: 6 }] },
        { length: 920, minDistance: 980, obstacles: [{ x: 240, kind: 'crate' }, { x: 650, kind: 'cactus' }], coinPatterns: [{ x: 450, y: 250, kind: 'bigCat' }], powers: [{ x: 760, y: 260, kind: 'score' }] },
        { length: 900, minDistance: 1200, obstacles: [{ x: 260, kind: 'hangingBell' }, { x: 650, kind: 'mushroom' }], coinArcs: [{ x: 145, y: 105, count: 4 }, { x: 510, y: 230, count: 5 }] },
        { length: 940, minDistance: 1500, obstacles: [{ x: 270, kind: 'mushroom' }, { x: 650, kind: 'spikes' }], coinArcs: [{ x: 130, y: 150, count: 5 }], coinPatterns: [{ x: 690, y: 235, kind: 'dog' }], powers: [{ x: 480, y: 238, kind: 'dash' }] },
        { length: 980, minDistance: 1800, obstacles: [{ x: 260, kind: 'cactus' }, { x: 690, kind: 'hangingBell' }], coinPatterns: [{ x: 430, y: 238, kind: 'crown' }], powers: [{ x: 790, y: 255, kind: 'shield' }] },
        { length: 1020, minDistance: 2150, obstacles: [{ x: 250, kind: 'crate' }, { x: 620, kind: 'spikes' }, { x: 930, kind: 'mushroom' }], coinArcs: [{ x: 110, y: 120, count: 5 }], coinPatterns: [{ x: 720, y: 240, kind: 'smile' }] },
        { length: 1040, minDistance: 2500, obstacles: [{ x: 280, kind: 'spikes' }, { x: 690, kind: 'cactus' }], coinPatterns: [{ x: 430, y: 250, kind: 'house' }], powers: [{ x: 860, y: 245, kind: 'score' }] },
        { length: 1080, minDistance: 2900, obstacles: [{ x: 260, kind: 'lowSign' }, { x: 670, kind: 'crate' }], coinArcs: [{ x: 390, y: 165, count: 5 }], coinPatterns: [{ x: 820, y: 238, kind: 'cat' }] },
        { length: 1120, minDistance: 3300, obstacles: [{ x: 300, kind: 'cactus' }, { x: 760, kind: 'cactus' }], coinArcs: [{ x: 130, y: 110, count: 4 }], coinPatterns: [{ x: 560, y: 245, kind: 'bigCat' }], powers: [{ x: 920, y: 245, kind: 'dash' }] },
        { length: 1180, minDistance: 3800, obstacles: [{ x: 260, kind: 'crate' }, { x: 680, kind: 'spikes' }, { x: 1010, kind: 'lowSign' }], coinPatterns: [{ x: 470, y: 220, kind: 'star' }, { x: 860, y: 160, kind: 'fish' }] },
        { length: 1240, minDistance: 4300, obstacles: [{ x: 280, kind: 'lowSign' }, { x: 720, kind: 'mushroom' }, { x: 1080, kind: 'crate' }], coinArcs: [{ x: 130, y: 105, count: 4 }], coinPatterns: [{ x: 840, y: 260, kind: 'crown' }], powers: [{ x: 1040, y: 245, kind: 'magnet' }] },
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
        this.updateMissiles(dt);
        this.applyMagnet(dt);
        this.spawnWhileNeeded();
        this.maybeSpawnMissile(dt);
        this.checkCollectibles();
        this.checkObstacles();
        this.checkMissiles();
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
        const backgroundVisibleHeight = 598;
        this.createParallaxLayer(bgRoot, 'SeamlessKawaiiBackground', this.textures.seamlessBg, 0, 1280, backgroundVisibleHeight, this.surfaceY + backgroundVisibleHeight * 0.5);

        const groundWidth = 1280;
        const groundHeight = 122;
        const groundLayer = this.makeNode('GroundLayer', this.worldRoot, new Vec3(0, this.surfaceY - groundHeight * 0.5, 0));
        this.groundScroller = groundLayer.addComponent(WorldScroller);
        this.groundScroller.speedMultiplier = 1;
        this.groundScroller.wrapWidth = groundWidth;
        for (let i = 0; i < 3; i++) {
            this.makeSprite(`Ground_${i}`, groundLayer, this.textures.ground, groundWidth, groundHeight, new Vec3(i * groundWidth, 0, 0));
        }

        this.obstacleRoot = this.makeNode('Obstacles', this.worldRoot, Vec3.ZERO);
        this.itemRoot = this.makeNode('CollectiblesAndPowerups', this.worldRoot, Vec3.ZERO);
        this.missileRoot = this.makeNode('Missiles', this.worldRoot, Vec3.ZERO);
        this.player = this.makeSprite('HakimiRunner', this.worldRoot, this.textures.runner, 172, 172, new Vec3(this.playerX, this.playerGroundY, 0));
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
                this.audioManager,
            );
        }
        this.applySelectedSkin();

        // Wire AudioManager: AudioManager node is sibling of Canvas at scene root
        const scene = this.node.parent?.parent;
        const amNode = scene?.getChildByName('AudioManager');
        this.audioManager = amNode?.getComponent(AudioManager) ?? null;

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
            pause: this.textures.pauseIcon,
        };
        this.hud.build(this.textures.button, this.textures.panel, this.textures.logo, icons, this.textures.uiFont);
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
            magnet: this.makeSprite('MagnetFx', this.playerFxRoot, this.textures.magnetFx, 218, 218, new Vec3(0, 6, 0)),
            shield: this.makeSprite('ShieldFx', this.playerFxRoot, this.textures.shieldFx, 202, 202, new Vec3(0, 4, 0)),
            dash: this.makeSprite('DashFx', this.playerFxRoot, this.textures.dashFx, 252, 112, new Vec3(-92, -8, 0)),
            score: this.makeSprite('ScoreFx', this.playerFxRoot, this.textures.scoreFx, 206, 206, new Vec3(0, 10, 0)),
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
        addButton(this.hud?.getLeaderboardNode() ?? null, this.onLeaderboardPressed);
        addButton(this.hud?.getPauseNode() ?? null, this.onPausePressed);
        addButton(this.hud?.getContinueNode() ?? null, this.onContinuePressed);
        addButton(this.hud?.getMenuNode() ?? null, this.onMenuPressed);
        addButton(this.hud?.getSettingsBackNode() ?? null, this.onBackPressed);
        addButton(this.hud?.getUpgradeBackNode() ?? null, this.onBackPressed);
        addButton(this.hud?.getLeaderboardBackNode() ?? null, this.onLeaderboardBackPressed);
        addButton(this.hud?.getReviveAdNode() ?? null, this.onReviveAdPressed);
        addButton(this.hud?.getReviveGiveUpNode() ?? null, this.onReviveGiveUpPressed);
        addButton(this.hud?.getRetryNode() ?? null, this.onStartPressed);
        addButton(this.hud?.getResultMenuNode() ?? null, this.onMenuPressed);
        addButton(this.hud?.getResultShopNode() ?? null, this.onUpgradePressed);
        addButton(this.hud?.getResultLeaderboardNode() ?? null, this.onLeaderboardPressed);
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
        parallax.wrapWidth = width;
        this.parallaxLayers.push(parallax);
        for (let i = -1; i <= 1; i++) {
            this.makeSprite(`${name}_${i + 2}`, layer, frame, width, height, new Vec3(i * width, 0, 0));
        }
    }

    private resetRunData(): void {
        this.speed = this.baseSpeed;
        this.distance = 0;
        this.runCoins = 0;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
        this.dodges = 0;
        this.shieldBlocks = 0;
        this.reviveUsed = false;
        this.nextSpawnX = 700;
        this.missileCooldown = 3.8;
        this.spaceHeld = false;
        this.touchHeld = false;
        this.powers = { magnet: 0, shield: 0, score: 0, dash: 0 };
        this.updatePowerEffects(0);
        this.obstacles.length = 0;
        this.collectibles.length = 0;
        this.missiles.length = 0;
        this.obstacleRoot?.removeAllChildren();
        this.itemRoot?.removeAllChildren();
        this.missileRoot?.removeAllChildren();
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
        this.audioManager?.playBgm('audio/background');
        this.audioManager?.playSfx('start');
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

    public setBgmVolume(volume: number): void {
        this.audioManager?.setBgmVolume(volume);
    }

    public setSfxVolume(volume: number): void {
        this.audioManager?.setSfxVolume(volume);
    }

    private gameOver(): void {
        if (this.state !== 'playing' && this.state !== 'revive') {
            return;
        }
        this.state = 'gameover';
        const finalScore = Math.floor(this.score);
        const baseReward = this.runCoins + Math.floor(this.distance / 120);
        const missions = this.missionViews();
        const missionReward = missions.reduce((sum, mission) => sum + (mission.completed ? mission.reward : 0), 0);
        const newAchievements = this.unlockedAchievements(finalScore, this.saveData.totalCoins + baseReward + missionReward);
        const achievementReward = newAchievements.reduce((sum, achievement) => sum + achievement.reward, 0);
        const reward = baseReward + missionReward + achievementReward;
        this.saveData.totalCoins += reward;
        if (finalScore > this.saveData.bestScore) {
            this.saveData.bestScore = finalScore;
        }
        this.saveData.missionsCompleted += missions.filter((mission) => mission.completed).length;
        for (const achievement of newAchievements) {
            this.saveData.achievements[achievement.id] = true;
        }
        const rank = this.recordLeaderboard(finalScore);
        this.saveGame();
        this.hud?.setGameOver({
            score: finalScore,
            runCoins: this.runCoins,
            totalCoins: this.saveData.totalCoins,
            distance: this.distance,
            reward,
            rank,
            missions,
            achievements: newAchievements,
            leaderboard: this.leaderboardView(10),
        });
        this.feedback?.shake(this.worldRoot, 12);
        this.audioManager?.playSfx('gameover');
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
        this.spawnObstacle(1520, 'hangingBell');
        this.nextSpawnX = 1960;
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
            const stage = this.currentStage();
            const stageGapTrim = Math.min(140, stage * 28);
            this.nextSpawnX += pattern.length + this.randomRange(this.patternGapMin - stageGapTrim, this.patternGapMax - stageGapTrim);
        }
    }

    private spawnObstacle(x: number, kind: ObstacleKind): void {
        if (!this.textures || !this.obstacleRoot) {
            return;
        }
        const data = {
            mushroom: { frame: this.textures.mushroom, width: 92, height: 84, y: this.surfaceY + 42, padX: 20, padY: 18, passType: 'jump' as ObstaclePassType },
            cactus: { frame: this.textures.cactus, width: 84, height: 100, y: this.surfaceY + 50, padX: 18, padY: 15, passType: 'jump' as ObstaclePassType },
            crate: { frame: this.textures.crate, width: 78, height: 66, y: this.surfaceY + 33, padX: 14, padY: 11, passType: 'jump' as ObstaclePassType },
            spikes: { frame: this.textures.spikes, width: 112, height: 56, y: this.surfaceY + 28, padX: 18, padY: 11, passType: 'jump' as ObstaclePassType },
            lowSign: { frame: this.textures.lowSign, width: 136, height: 104, y: this.surfaceY + 132, padX: 24, padY: 20, passType: 'slide' as ObstaclePassType },
            hangingBell: { frame: this.textures.hangingBell, width: 104, height: 142, y: this.surfaceY + 150, padX: 18, padY: 26, passType: 'slide' as ObstaclePassType },
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
            bigCat: [
                [1, 0], [2, 0], [6, 0], [7, 0],
                [0, 1], [3, 1], [5, 1], [8, 1],
                [0, 2], [8, 2],
                [0, 3], [2, 3], [6, 3], [8, 3],
                [0, 4], [3, 4], [4, 4], [5, 4], [8, 4],
                [1, 5], [2, 5], [4, 5], [6, 5], [7, 5],
                [2, 6], [3, 6], [4, 6], [5, 6], [6, 6],
                [3, 7], [5, 7],
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
            star: [
                [2, 0],
                [1, 1], [2, 1], [3, 1],
                [0, 2], [1, 2], [2, 2], [3, 2], [4, 2],
                [1, 3], [3, 3],
                [0, 4], [4, 4],
            ],
            crown: [
                [0, 0], [2, 0], [4, 0],
                [0, 1], [1, 1], [2, 1], [3, 1], [4, 1],
                [0, 2], [1, 2], [2, 2], [3, 2], [4, 2],
                [0, 3], [1, 3], [2, 3], [3, 3], [4, 3],
            ],
            smile: [
                [1, 0], [4, 0],
                [0, 2], [5, 2],
                [1, 3], [4, 3],
                [2, 4], [3, 4],
            ],
            house: [
                [2, 0],
                [1, 1], [2, 1], [3, 1],
                [0, 2], [1, 2], [2, 2], [3, 2], [4, 2],
                [0, 3], [2, 3], [4, 3],
                [0, 4], [1, 4], [2, 4], [3, 4], [4, 4],
            ],
        };
        const points = maps[kind];
        const step = kind === 'bigCat' ? 34 : 38;
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
        const size = kind === 'coin' ? 32 : 44;
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
                this.recordCombo();
                this.comboTimer = 2.2;
                this.score += (100 + Math.min(300, this.combo * 8)) * value * this.currentMultiplier();
                this.audioManager?.playSfx('coin');
            } else {
                collectible.collect();
                this.activatePower(collectible.kind);
                this.audioManager?.playSfx('powerup');
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
                this.recordCombo();
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
                this.shieldBlocks += 1;
                obstacle.node.active = false;
                this.flashPlayer();
                this.feedback?.shake(this.worldRoot, 8);
                this.feedback?.showText('\u62a4\u76fe\u62b5\u6321', obstacle.node.position.clone().add(new Vec3(0, 60, 0)), new Color(74, 145, 226, 255), 26);
                continue;
            }
            this.offerRevive();
            return;
        }
    }

    private maybeSpawnMissile(dt: number): void {
        if (!this.textures || !this.missileRoot || this.distance < this.missileUnlockDistance) {
            return;
        }
        if (this.missiles.some((missile) => missile.state === 'warning' || missile.state === 'flying')) {
            return;
        }
        this.missileCooldown -= dt;
        if (this.missileCooldown > 0) {
            return;
        }

        const stage = this.currentStage();
        const warningDuration = Math.max(0.85, 1.62 - stage * 0.12);
        const speed = 980 + stage * 96 + this.speed * 0.28;
        const lanes = [this.playerGroundY + 46, this.playerGroundY + 74, this.playerGroundY + 102];
        const y = lanes[Math.floor(Math.random() * lanes.length)] ?? lanes[0];
        this.spawnMissileWarning(y, warningDuration, speed);
        this.missileCooldown = Math.max(3.7, this.missileBaseCooldown - stage * 0.56 + this.randomRange(-0.65, 1.05));
    }

    private spawnMissileWarning(y: number, warningDuration: number, speed: number): void {
        if (!this.missileRoot) {
            return;
        }
        const warningNode = this.makeNode('MissileWarning', this.missileRoot, new Vec3(0, y, 0));
        const transform = warningNode.addComponent(UITransform);
        transform.setContentSize(1280, 36);
        warningNode.addComponent(Graphics);
        const threat: MissileThreat = {
            warningNode,
            missileNode: null,
            trailNode: null,
            y,
            state: 'warning',
            timer: 0,
            warningDuration,
            speed,
            hit: false,
        };
        this.drawMissileWarning(threat, 0);
        this.missiles.push(threat);
        this.feedback?.showText('\u5bfc\u5f39\u9884\u8b66\uff01', new Vec3(260, y + 28, 0), new Color(230, 92, 62, 255), 24);
    }

    private updateMissiles(dt: number): void {
        if (!this.textures || !this.missileRoot) {
            return;
        }
        for (const missile of this.missiles) {
            missile.timer += dt;
            if (missile.state === 'warning') {
                const progress = Math.min(1, missile.timer / missile.warningDuration);
                this.drawMissileWarning(missile, progress);
                if (missile.timer >= missile.warningDuration) {
                    missile.warningNode.destroy();
                    const trail = this.makeSprite('MissileTrail', this.missileRoot, this.textures.missileTrail, 168, 82, new Vec3(830, missile.y, 0));
                    const body = this.makeSprite('Missile', this.missileRoot, this.textures.missile, 162, 82, new Vec3(740, missile.y, 0));
                    missile.trailNode = trail;
                    missile.missileNode = body;
                    missile.state = 'flying';
                    missile.timer = 0;
                    this.feedback?.shake(this.worldRoot, 4);
                }
                continue;
            }
            const node = missile.missileNode;
            if (!node || !node.isValid || !node.active) {
                continue;
            }
            const pos = node.position.clone();
            pos.x -= missile.speed * dt;
            node.setPosition(pos);
            if (missile.trailNode && missile.trailNode.isValid) {
                const pulse = 1 + Math.sin(Date.now() * 0.018) * 0.08;
                missile.trailNode.setPosition(pos.x + 104, missile.y + Math.sin(Date.now() * 0.012) * 2, 0);
                missile.trailNode.setScale(pulse, pulse, 1);
            }
            if (pos.x < -820) {
                node.destroy();
                missile.trailNode?.destroy();
            }
        }
        this.missiles = this.missiles.filter((missile) => {
            if (missile.state === 'warning') {
                return missile.warningNode.isValid;
            }
            return !!missile.missileNode?.isValid && missile.missileNode.position.x > -840 && !missile.hit;
        });
    }

    private drawMissileWarning(missile: MissileThreat, progress: number): void {
        const graphics = missile.warningNode.getComponent(Graphics);
        if (!graphics) {
            return;
        }
        const pulseFrequency = 5 + progress * 14;
        const flash = Math.sin(missile.timer * pulseFrequency * Math.PI * 2) > -0.35;
        const alpha = flash ? 210 + Math.round(progress * 45) : 60 + Math.round(progress * 70);
        graphics.clear();
        graphics.lineWidth = 8 + progress * 3;
        graphics.strokeColor = new Color(238, 84, 60, alpha);
        for (let x = -610; x < 550; x += 90) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x + 52, 0);
        }
        graphics.stroke();
        graphics.lineWidth = 2;
        graphics.strokeColor = new Color(255, 236, 123, Math.min(255, alpha + 20));
        for (let x = -610; x < 550; x += 90) {
            graphics.moveTo(x, -8);
            graphics.lineTo(x + 52, -8);
            graphics.moveTo(x, 8);
            graphics.lineTo(x + 52, 8);
        }
        graphics.stroke();
        graphics.fillColor = new Color(238, 84, 60, alpha);
        for (let x = 520; x <= 600; x += 40) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x - 20, 14);
            graphics.lineTo(x - 20, -14);
            graphics.close();
            graphics.fill();
        }
    }

    private checkMissiles(): void {
        const playerBox = this.getPlayerHitBox();
        for (const missile of this.missiles) {
            if (missile.state !== 'flying' || missile.hit || !missile.missileNode?.active) {
                continue;
            }
            if (!playerBox.intersects(this.getMissileHitBox(missile))) {
                continue;
            }
            missile.hit = true;
            if (this.powers.dash > 0) {
                this.score += 220 * this.currentMultiplier();
                missile.missileNode.active = false;
                missile.trailNode?.destroy();
                this.feedback?.showText('\u51b2\u6563\u5bfc\u5f39 +220', missile.missileNode.position.clone().add(new Vec3(0, 48, 0)), new Color(113, 142, 236, 255), 24);
                continue;
            }
            if (this.powers.shield > 0) {
                this.powers.shield = 0;
                this.shieldBlocks += 1;
                missile.missileNode.active = false;
                missile.trailNode?.destroy();
                this.flashPlayer();
                this.feedback?.shake(this.worldRoot, 10);
                this.feedback?.showText('\u62a4\u76fe\u6321\u4e0b\u5bfc\u5f39', missile.missileNode.position.clone().add(new Vec3(0, 52, 0)), new Color(74, 145, 226, 255), 26);
                continue;
            }
            this.feedback?.shake(this.worldRoot, 12);
            this.offerRevive();
            return;
        }
    }

    private getMissileHitBox(missile: MissileThreat): Rect {
        const node = missile.missileNode;
        if (!node) {
            return new Rect();
        }
        const pos = node.worldPosition;
        return new Rect(pos.x - 58, pos.y - 22, 116, 44);
    }

    private offerRevive(): void {
        if (this.reviveUsed) {
            this.gameOver();
            return;
        }
        this.reviveUsed = true;
        this.state = 'revive';
        this.hud?.setRevive();
        this.feedback?.shake(this.worldRoot, 8);
        this.feedback?.showText('\u8981\u590d\u6d3b\u5417\uff1f', new Vec3(0, 24, 0), new Color(255, 152, 84, 255), 30);
    }

    private reviveFromAd(): void {
        if (this.state !== 'revive') {
            return;
        }
        this.clearDangerAroundPlayer();
        this.powers.shield = Math.max(this.powers.shield, 3.5);
        this.comboTimer = 1.4;
        this.state = 'playing';
        this.hud?.setPlaying();
        this.flashPlayer();
        this.updatePowerEffects(0);
        this.feedback?.showText('\u590d\u6d3b\u6210\u529f\uff01', new Vec3(this.playerX + 70, this.playerGroundY + 120, 0), new Color(74, 145, 226, 255), 28);
        this.audioManager?.playSfx('powerup');
    }

    private clearDangerAroundPlayer(): void {
        for (const obstacle of this.obstacles) {
            const x = obstacle.node.position.x;
            if (x > this.playerX - 120 && x < this.playerX + 420) {
                obstacle.node.active = false;
            }
        }
        this.obstacles = this.obstacles.filter((item) => item.node.isValid && item.node.active);
        for (const missile of this.missiles) {
            const x = missile.missileNode?.position.x ?? 9999;
            if (missile.state === 'warning' || (x > this.playerX - 180 && x < this.playerX + 520)) {
                missile.warningNode?.destroy();
                missile.missileNode?.destroy();
                missile.trailNode?.destroy();
                missile.hit = true;
            }
        }
        this.missiles = this.missiles.filter((missile) => !missile.hit && missile.missileNode?.isValid);
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
            const time = Date.now() * 0.001;
            if (kind === 'magnet') {
                node.angle += 76 * dt;
                node.setScale(1 + Math.sin(time * 7.4) * 0.055, 1 + Math.cos(time * 6.6) * 0.045, 1);
                continue;
            }
            if (kind === 'score') {
                node.angle -= 38 * dt;
                const pulse = 1 + Math.sin(time * 8.5) * 0.06;
                node.setScale(pulse, pulse, 1);
                continue;
            }
            if (kind === 'dash') {
                const stretch = 1 + Math.sin(time * 14) * 0.075;
                node.setPosition(-92 + Math.sin(time * 17) * 4, -8 + Math.cos(time * 12) * 2, 0);
                node.setScale(stretch, 1 + Math.cos(time * 13) * 0.035, 1);
                continue;
            }
            const pulse = 1 + Math.sin(time * 6.5) * 0.045;
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

    private recordCombo(): void {
        this.maxCombo = Math.max(this.maxCombo, this.combo);
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
        const stageBonus = this.currentStage() * 180;
        const available = this.coursePatterns.filter((pattern) => this.distance + stageBonus >= (pattern.minDistance ?? 0));
        return available[Math.floor(Math.random() * available.length)] ?? this.coursePatterns[0];
    }

    private currentStage(): number {
        return Math.min(5, Math.floor(this.distance / 900));
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
                this.runner?.slide(true);
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
        if (event.keyCode === KeyCode.ARROW_DOWN || event.keyCode === KeyCode.KEY_S) {
            this.runner?.stopSlide();
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
    private onLeaderboardPressed(): void { this.hud?.setLeaderboard(this.leaderboardView(10)); }
    private onLeaderboardBackPressed(): void { this.hud?.closeLeaderboard(); }
    private onReviveAdPressed(): void { this.reviveFromAd(); }
    private onReviveGiveUpPressed(): void { this.gameOver(); }
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

    private missionText(): string {
        return this.missionViews().map((mission) => {
            const current = Math.min(mission.current, mission.target);
            const mark = mission.completed ? '\u2713' : `${current}/${mission.target}`;
            return `${mission.label} ${mark}`;
        }).join('   ');
    }

    private missionViews(): MissionView[] {
        return MISSION_DEFS.map((mission) => {
            const current = this.missionCurrent(mission.id);
            return {
                label: mission.label,
                current,
                target: mission.target,
                reward: mission.reward,
                completed: current >= mission.target,
            };
        });
    }

    private missionCurrent(id: MissionId): number {
        if (id === 'coins') return this.runCoins;
        if (id === 'distance') return Math.floor(this.distance);
        return this.dodges;
    }

    private unlockedAchievements(finalScore: number, projectedCoins: number): Array<AchievementView & { id: AchievementId }> {
        const unlocked: Array<AchievementView & { id: AchievementId }> = [];
        for (const achievement of ACHIEVEMENT_DEFS) {
            if (this.saveData.achievements[achievement.id] || !this.isAchievementDone(achievement.id, finalScore, projectedCoins)) {
                continue;
            }
            unlocked.push({ id: achievement.id, label: achievement.label, reward: achievement.reward });
        }
        return unlocked;
    }

    private isAchievementDone(id: AchievementId, finalScore: number, projectedCoins: number): boolean {
        if (id === 'first1k') return this.distance >= 1000;
        if (id === 'coinCollector') return projectedCoins >= 500;
        if (id === 'combo20') return this.maxCombo >= 20 || finalScore >= 5000;
        return this.shieldBlocks >= 3;
    }

    private recordLeaderboard(score: number): number {
        const entry: LeaderboardEntry = {
            score,
            distance: Math.floor(this.distance),
            coins: this.runCoins,
            date: new Date().toISOString(),
        };
        this.saveData.leaderboard = [...this.saveData.leaderboard, entry]
            .sort((a, b) => b.score - a.score || b.distance - a.distance || b.coins - a.coins)
            .slice(0, 10);
        const index = this.saveData.leaderboard.indexOf(entry);
        return index >= 0 ? index + 1 : this.saveData.leaderboard.length;
    }

    private leaderboardView(limit = 10): LeaderboardEntryView[] {
        return this.saveData.leaderboard.slice(0, limit).map((entry, index) => ({
            rank: index + 1,
            score: entry.score,
            distance: entry.distance,
            coins: entry.coins,
        }));
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
            leaderboard: this.saneLeaderboard(parsed?.leaderboard),
            achievements: this.saneAchievements(parsed?.achievements),
        };
    }

    private saneLevel(value: unknown): number {
        return Math.max(1, Math.min(MAX_UPGRADE_LEVEL, Math.floor(Number(value ?? 1))));
    }

    private saneLeaderboard(value: unknown): LeaderboardEntry[] {
        if (!Array.isArray(value)) {
            return [];
        }
        return value.map((entry) => ({
            score: Math.max(0, Math.floor(Number(entry?.score ?? 0))),
            distance: Math.max(0, Math.floor(Number(entry?.distance ?? 0))),
            coins: Math.max(0, Math.floor(Number(entry?.coins ?? 0))),
            date: typeof entry?.date === 'string' ? entry.date : '',
        })).filter((entry) => entry.score > 0)
            .sort((a, b) => b.score - a.score || b.distance - a.distance || b.coins - a.coins)
            .slice(0, 10);
    }

    private saneAchievements(value: unknown): Partial<Record<AchievementId, boolean>> {
        const source = typeof value === 'object' && value !== null ? value as Partial<Record<AchievementId, boolean>> : {};
        const achievements: Partial<Record<AchievementId, boolean>> = {};
        for (const achievement of ACHIEVEMENT_DEFS) {
            achievements[achievement.id] = source[achievement.id] === true;
        }
        return achievements;
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
            missile,
            missileTrail,
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
            pauseIcon,
            uiFont,
        ] = await Promise.all([
            this.loadSpriteFrame('textures/world/seamless_bg'),
            this.loadSpriteFrame('textures/world/sky'),
            this.loadSpriteFrame('textures/world/mountains'),
            this.loadSpriteFrame('textures/world/city'),
            this.loadSpriteFrame('textures/world/ground_tile'),
            this.loadSpriteFrame('textures/world/foreground_deco'),
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
            this.loadSpriteFrame('textures/items/missile'),
            this.loadSpriteFrame('textures/items/missile_trail'),
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
            this.loadSpriteFrame('textures/ui/pause_icon'),
            this.loadFont('fonts/ZCOOLKuaiLe-Regular'),
        ]);
        const [runnerRun, runnerJump, runnerSlide, runnerGlide] = await Promise.all([
            this.loadSpriteFrames('textures/runner/v2/run', 26),
            this.loadSpriteFrames('textures/runner/v2/jump_land', 18),
            this.loadSpriteFrames('textures/runner/v2/slide', 18),
            this.loadSpriteFrames('textures/runner/v2/glide_land', 20),
        ]);
        return {
            seamlessBg,
            sky,
            mountains,
            city,
            ground,
            foregroundDeco,
            runner: runnerRun[0],
            runnerRun,
            runnerJump,
            runnerFall: runnerJump[Math.min(12, runnerJump.length - 1)],
            runnerGlide,
            runnerSlide,
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
            missile,
            missileTrail,
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
            pauseIcon,
            uiFont,
        };
    }

    private loadFont(path: string): Promise<Font> {
        return new Promise((resolve, reject) => {
            resources.load(path, Font, (error, font) => {
                if (error || !font) {
                    reject(error ?? new Error(`Missing font: ${path}`));
                    return;
                }
                resolve(font);
            });
        });
    }

    private loadSpriteFrames(prefix: string, count: number): Promise<SpriteFrame[]> {
        const tasks: Array<Promise<SpriteFrame>> = [];
        for (let i = 0; i < count; i++) {
            const suffix = i < 10 ? `0${i}` : `${i}`;
            tasks.push(this.loadSpriteFrame(`${prefix}_${suffix}`));
        }
        return Promise.all(tasks);
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
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = frame;
        transform.setContentSize(width, height);
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
