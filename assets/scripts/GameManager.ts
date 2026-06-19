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
import { AchievementEntryView, AchievementView, ConsumableInventory, ConsumableKind, ConsumableShopView, GameHud, GameOverView, HudIconFrames, HudSaveView, LeaderboardEntryView, Language, MissionView, PowerState, SettingsView, ShopTab, SkinView, UpgradeLevels } from './GameHud';
import { Obstacle, ObstaclePassType } from './Obstacle';
import { ParallaxLayer } from './ParallaxLayer';
import { RunnerController } from './RunnerController';
import { AudioManager } from './AudioManager';
import { WorldScroller } from './WorldScroller';

const { ccclass, property } = _decorator;

type GameState = 'menu' | 'settings' | 'upgrade' | 'achievements' | 'playing' | 'casual' | 'pause' | 'revive' | 'gameover';
type ObstacleKind = 'mushroom' | 'cactus' | 'crate' | 'spikes' | 'turtle' | 'lowSign' | 'hangingBell';
type PowerKind = keyof PowerState;
type SkinId = 'classic' | 'berry' | 'mint';
type CoinPatternKind = 'cat' | 'bigCat' | 'dog' | 'fish' | 'paw' | 'heart' | 'star' | 'crown' | 'smile' | 'house' | 'megaCat' | 'giantPaw' | 'fishboneBig' | 'ribbon' | 'one' | 'two' | 'three' | 'go';
type CoinTone = 'gold' | 'silver' | 'bronze';
type CasualCloudKind = 'normal' | 'moving' | 'break' | 'bounce';
type MissionId = 'coins' | 'distance' | 'dodges';
type ActiveItemKind = 'fishDart' | 'mysteryBox';
type AchievementId = 'firstRun' | 'first1k' | 'first3k' | 'coinCollector' | 'coinTycoon' | 'combo20' | 'combo50' | 'shieldGuard' | 'missileGuard' | 'skinCollector' | 'upgradeNovice' | 'upgradeMaster' | 'missionRunner' | 'glideRunner'
    | 'highObstacleFirst' | 'highObstacleMaster' | 'missileFirstDodge' | 'missileHunter' | 'turtleStomp' | 'turtleSweeper' | 'turtleRampage' | 'flyingCoinCatch' | 'wingedTreasure'
    | 'casualFirstCloud' | 'casualBreakCloud' | 'casualBreakMaster' | 'casualClimber' | 'casualSkyHigh' | 'casualNoFall30' | 'casualBounceChain'
    | 'reviveTicketUsed' | 'shopCustomer' | 'powerSnack' | 'coinVariety';

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

type TurtleShell = {
    node: Node;
    width: number;
    height: number;
    clears: number;
};

type FlyingCoin = {
    node: Node;
    baseY: number;
    phase: number;
    amplitude: number;
    speed: number;
};

type FishProjectile = {
    node: Node;
    width: number;
    height: number;
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
    runnerSkins: Record<SkinId, RunnerSkinFrames>;
    coin: SpriteFrame;
    coinSilver: SpriteFrame;
    coinBronze: SpriteFrame;
    coinFlying: SpriteFrame;
    diamond: SpriteFrame;
    magnet: SpriteFrame;
    shield: SpriteFrame;
    scoreStar: SpriteFrame;
    dash: SpriteFrame;
    fishDart: SpriteFrame;
    mysteryBox: SpriteFrame;
    fishProjectile: SpriteFrame;
    reviveTicket: SpriteFrame;
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
    turtleNormal: SpriteFrame;
    turtleShell: SpriteFrame;
    lowSign: SpriteFrame;
    hangingBell: SpriteFrame;
    button: SpriteFrame;
    panel: SpriteFrame;
    badge: SpriteFrame;
    logo: SpriteFrame;
    pauseIcon: SpriteFrame;
    achievementStar: SpriteFrame;
    achievementIcons: SpriteFrame[];
    resultBg: SpriteFrame;
    resultPanel: SpriteFrame;
    resultScore: SpriteFrame;
    resultCoin: SpriteFrame;
    resultDistance: SpriteFrame;
    resultBest: SpriteFrame;
    menuBestPanel: SpriteFrame;
    hudStatsPanel: SpriteFrame;
    activeItemBase: SpriteFrame;
    shopPanel: SpriteFrame;
    achievementPanel: SpriteFrame;
    settingsPanel: SpriteFrame;
    pausePanel: SpriteFrame;
    leaderboardPanel: SpriteFrame;
    cloudNormal: SpriteFrame;
    cloudBreak: SpriteFrame;
    cloudBounce: SpriteFrame;
    uiFont: Font;
};

type CasualCloud = {
    node: Node;
    kind: CasualCloudKind;
    width: number;
    height: number;
    used: boolean;
    moveDir: number;
    moveSpeed: number;
    baseX: number;
};

type RunnerSkinFrames = {
    preview: SpriteFrame;
    run: SpriteFrame[];
    jump: SpriteFrame[];
    fall: SpriteFrame;
    glide: SpriteFrame[];
    slide: SpriteFrame[];
    power: Record<PowerKind, SpriteFrame>;
};

type GameSettings = {
    language: Language;
    bgmVolume: number;
    sfxVolume: number;
    assistHints: boolean;
};

type GameSave = {
    bestScore: number;
    bestScoreToday: number;
    bestScoreDate: string;
    totalCoins: number;
    totalStars: number;
    totalRuns: number;
    totalDistance: number;
    selectedSkin: SkinId;
    unlockedSkins: SkinId[];
    upgrades: UpgradeLevels;
    inventory: ConsumableInventory;
    reviveTicketsUsed: number;
    consumablesBought: number;
    missionsCompleted: number;
    leaderboard: LeaderboardEntry[];
    achievements: Partial<Record<AchievementId, boolean>>;
    settings: GameSettings;
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
    description: string;
    reward: number;
};

const POWER_KINDS: PowerKind[] = ['magnet', 'shield', 'score', 'dash'];
const POWER_NAMES: Record<PowerKind, string> = {
    magnet: '\u78c1\u94c1',
    shield: '\u62a4\u76fe',
    score: '\u53cc\u500d',
    dash: '\u51b2\u523a',
};
const POWER_NAMES_EN: Record<PowerKind, string> = {
    magnet: 'Magnet',
    shield: 'Shield',
    score: 'Double',
    dash: 'Dash',
};
const DEFAULT_UPGRADES: UpgradeLevels = { magnet: 1, shield: 1, score: 1, dash: 1 };
const DEFAULT_SETTINGS: GameSettings = { language: 'zh', bgmVolume: 0.65, sfxVolume: 0.8, assistHints: true };
const DEFAULT_INVENTORY: ConsumableInventory = { startDash: 0, reviveTicket: 0, startShield: 0 };
const CONSUMABLE_COSTS: Record<ConsumableKind, number> = { startDash: 120, reviveTicket: 180, startShield: 90 };
const UPGRADE_BASE_COST: Record<PowerKind, number> = { magnet: 80, shield: 90, score: 110, dash: 130 };
const MAX_UPGRADE_LEVEL = 5;
const SKINS: Array<{ id: SkinId; label: string; shortLabel: string; cost: number; resourceDir: string }> = [
    { id: 'classic', label: '\u7ecf\u5178\u54c8\u57fa\u7c73', shortLabel: '\u7ecf\u5178', cost: 0, resourceDir: 'textures/runner/v2' },
    { id: 'berry', label: '\u8349\u8393\u751c\u5fc3\u54c8\u57fa\u7c73', shortLabel: '\u8349\u8393\u751c\u5fc3', cost: 160, resourceDir: 'textures/runner/skins/berry' },
    { id: 'mint', label: '\u8584\u8377\u98de\u884c\u5458\u54c8\u57fa\u7c73', shortLabel: '\u8584\u8377\u98de\u884c\u5458', cost: 220, resourceDir: 'textures/runner/skins/mint' },
];
const MISSION_DEFS: MissionDefinition[] = [
    { id: 'coins', label: '\u91d1\u5e01', target: 40, reward: 18 },
    { id: 'distance', label: '\u91cc\u7a0b', target: 600, reward: 18 },
    { id: 'dodges', label: '\u8d8a\u8fc7', target: 8, reward: 20 },
];
const ACHIEVEMENT_DEFS: AchievementDefinition[] = [
    { id: 'firstRun', label: '\u521d\u6b21\u51fa\u53d1', description: '\u5b8c\u6210\u4efb\u610f\u4e00\u5c40', reward: 1 },
    { id: 'first1k', label: '\u9996\u6b21 1000m', description: '\u5355\u5c40\u91cc\u7a0b\u8fbe\u5230 1000m', reward: 2 },
    { id: 'first3k', label: '\u8fdc\u884c\u732b\u732b', description: '\u5355\u5c40\u91cc\u7a0b\u8fbe\u5230 3000m', reward: 4 },
    { id: 'coinCollector', label: '\u95ea\u4eae\u6536\u85cf\u5bb6', description: '\u6301\u6709 500 \u91d1\u5e01', reward: 2 },
    { id: 'coinTycoon', label: '\u91d1\u5e01\u5c0f\u5bcc\u8c6a', description: '\u6301\u6709 1500 \u91d1\u5e01', reward: 4 },
    { id: 'combo20', label: '20 \u8fde\u51fb', description: '\u5355\u5c40\u8fbe\u6210 20 \u8fde\u51fb', reward: 2 },
    { id: 'combo50', label: '50 \u8fde\u51fb', description: '\u5355\u5c40\u8fbe\u6210 50 \u8fde\u51fb', reward: 4 },
    { id: 'shieldGuard', label: '\u62a4\u76fe\u5b88\u62a4', description: '\u5355\u5c40\u62a4\u76fe\u62b5\u6321 3 \u6b21', reward: 3 },
    { id: 'missileGuard', label: '\u5bfc\u5f39\u514b\u661f', description: '\u7528\u62a4\u76fe\u6216\u51b2\u523a\u6321\u4e0b\u5bfc\u5f39', reward: 3 },
    { id: 'skinCollector', label: '\u8863\u6a71\u6536\u85cf', description: '\u89e3\u9501 3 \u4e2a\u76ae\u80a4', reward: 3 },
    { id: 'upgradeNovice', label: '\u9053\u5177\u65b0\u624b', description: '\u4efb\u610f\u9053\u5177\u5347\u5230 Lv.3', reward: 2 },
    { id: 'upgradeMaster', label: '\u9053\u5177\u5927\u5e08', description: '\u6240\u6709\u9053\u5177\u5347\u5230 Lv.5', reward: 5 },
    { id: 'missionRunner', label: '\u4efb\u52a1\u8fbe\u4eba', description: '\u7d2f\u8ba1\u5b8c\u6210 10 \u4e2a\u4efb\u52a1', reward: 3 },
    { id: 'glideRunner', label: '\u6ed1\u7fd4\u9ad8\u624b', description: '\u5355\u5c40\u8d85\u8fc7 1800m', reward: 3 },
    { id: 'highObstacleFirst', label: '\u4f4e\u5934\u901a\u8fc7', description: '\u5355\u5c40\u6210\u529f\u4e0b\u6ed1\u8eb2\u8fc7 1 \u4e2a\u9ad8\u969c\u788d', reward: 2 },
    { id: 'highObstacleMaster', label: '\u8d34\u5730\u6ed1\u884c\u5bb6', description: '\u5355\u5c40\u6210\u529f\u4e0b\u6ed1\u8eb2\u8fc7 8 \u4e2a\u9ad8\u969c\u788d', reward: 4 },
    { id: 'missileFirstDodge', label: '\u706b\u7bad\u64e6\u80a9', description: '\u9996\u6b21\u8eb2\u8fc7\u6216\u6e05\u9664\u5bfc\u5f39', reward: 3 },
    { id: 'missileHunter', label: '\u706b\u7bad\u730e\u624b', description: '\u5355\u5c40\u6e05\u9664\u6216\u62b5\u6321 5 \u679a\u5bfc\u5f39', reward: 5 },
    { id: 'turtleStomp', label: '\u8e29\u9f9f\u542f\u52a8', description: '\u9996\u6b21\u8e29\u4e2d\u4e4c\u9f9f\u5e76\u89e6\u53d1\u9f9f\u58f3\u51b2\u523a', reward: 3 },
    { id: 'turtleSweeper', label: '\u9f9f\u58f3\u6e05\u9053\u592b', description: '\u5355\u6b21\u9f9f\u58f3\u51b2\u523a\u6e05\u9664 3 \u4e2a\u76ee\u6807', reward: 4 },
    { id: 'turtleRampage', label: '\u6a2a\u626b\u4e00\u8def', description: '\u5355\u5c40\u7528\u4e4c\u9f9f\u7d2f\u8ba1\u6e05\u9664 10 \u4e2a\u76ee\u6807', reward: 6 },
    { id: 'flyingCoinCatch', label: '\u98de\u884c\u91d1\u5e01', description: '\u9996\u6b21\u5403\u5230\u98de\u884c\u91d1\u5e01', reward: 2 },
    { id: 'wingedTreasure', label: '\u7a7a\u4e2d\u5b9d\u85cf', description: '\u5355\u5c40\u5403\u5230 15 \u4e2a\u98de\u884c\u91d1\u5e01', reward: 4 },
    { id: 'casualFirstCloud', label: '\u7a7f\u4e91\u800c\u4e0a', description: '\u4f11\u95f2\u6a21\u5f0f\u9996\u6b21\u7a7f\u8fc7\u4e91\u89e6\u53d1\u8df3\u8dc3', reward: 2 },
    { id: 'casualBreakCloud', label: '\u8e0f\u788e\u4e91\u6735', description: '\u4f11\u95f2\u6a21\u5f0f\u89e6\u53d1 1 \u6b21\u6613\u788e\u4e91', reward: 2 },
    { id: 'casualBreakMaster', label: '\u4e91\u5c42\u7834\u574f\u8005', description: '\u5355\u5c40\u89e6\u53d1 8 \u6b21\u6613\u788e\u4e91', reward: 4 },
    { id: 'casualClimber', label: '\u4e91\u7aef\u6563\u6b65', description: '\u4f11\u95f2\u6a21\u5f0f\u5355\u5c40\u8fbe\u5230 30 \u5c42', reward: 4 },
    { id: 'casualSkyHigh', label: '\u5c0f\u5c0f\u767b\u5929\u8005', description: '\u4f11\u95f2\u6a21\u5f0f\u5355\u5c40\u8fbe\u5230 80 \u5c42', reward: 6 },
    { id: 'casualNoFall30', label: '\u7a33\u7a33\u4e0a\u5347', description: '\u4f11\u95f2\u6a21\u5f0f\u8fde\u7eed 30 \u6b21\u89e6\u4e91\u4e0d\u6b7b\u4ea1', reward: 5 },
    { id: 'casualBounceChain', label: '\u5f39\u8df3\u8fde\u9501', description: '\u4f11\u95f2\u6a21\u5f0f\u8fde\u7eed\u89e6\u53d1 5 \u6b21\u8df3\u8dc3', reward: 4 },
    { id: 'reviveTicketUsed', label: '\u518d\u6765\u4e00\u6b21', description: '\u4f7f\u7528 1 \u5f20\u590d\u6d3b\u5238', reward: 3 },
    { id: 'shopCustomer', label: '\u5c0f\u5e97\u987e\u5ba2', description: '\u7d2f\u8ba1\u8d2d\u4e70 5 \u4e2a\u6d88\u8017\u9053\u5177', reward: 3 },
    { id: 'powerSnack', label: '\u80fd\u91cf\u8865\u7ed9', description: '\u5355\u5c40\u5403\u5230 5 \u4e2a\u9053\u5177', reward: 3 },
    { id: 'coinVariety', label: '\u91d1\u94f6\u94dc\u95ea\u95ea', description: '\u5355\u5c40\u5403\u5230\u91d1\u5e01\u3001\u94f6\u5e01\u3001\u94dc\u5e01\u4e09\u79cd', reward: 3 },
];

const DEFAULT_SAVE: GameSave = {
    bestScore: 0,
    bestScoreToday: 0,
    bestScoreDate: '',
    totalCoins: 0,
    totalStars: 0,
    totalRuns: 0,
    totalDistance: 0,
    selectedSkin: 'classic',
    unlockedSkins: ['classic'],
    upgrades: { ...DEFAULT_UPGRADES },
    inventory: { ...DEFAULT_INVENTORY },
    reviveTicketsUsed: 0,
    consumablesBought: 0,
    missionsCompleted: 0,
    leaderboard: [],
    achievements: {},
    settings: { ...DEFAULT_SETTINGS },
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
    private casualRoot: Node | null = null;
    private casualPlayer: Node | null = null;
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
    private turtleShells: TurtleShell[] = [];
    private flyingCoins: FlyingCoin[] = [];
    private fishProjectiles: FishProjectile[] = [];
    private casualClouds: CasualCloud[] = [];
    private powers: PowerState = { magnet: 0, shield: 0, score: 0, dash: 0 };
    private heldActiveItem: ActiveItemKind | null = null;
    private dashWasActive = false;
    private speed = 0;
    private distance = 0;
    private runCoins = 0;
    private score = 0;
    private combo = 0;
    private maxCombo = 0;
    private comboTimer = 0;
    private dodges = 0;
    private shieldBlocks = 0;
    private missileBlocks = 0;
    private missileDodges = 0;
    private slideDodges = 0;
    private turtleStomps = 0;
    private turtleClears = 0;
    private bestTurtleShellClears = 0;
    private flyingCoinsCollected = 0;
    private powerupsCollected = 0;
    private goldCoinsCollected = 0;
    private silverCoinsCollected = 0;
    private bronzeCoinsCollected = 0;
    private casualCloudTriggers = 0;
    private casualBreakClouds = 0;
    private casualJumpChain = 0;
    private casualBestJumpChain = 0;
    private reviveUsed = false;
    private reviveAdTimer = 0;
    private missionToastShown: Partial<Record<MissionId, boolean>> = {};
    private nextSpawnX = 720;
    private missileCooldown = 0;
    private spaceHeld = false;
    private touchHeld = false;
    private pendingSpaceAirAction = -1;
    private pendingTouchAirAction = -1;
    private jumpIntentTimer = -1;
    private touchJumpIntentTimer = -1;
    private casualVelocityY = 0;
    private casualHighestStep = 0;
    private casualLastPlayerY = 0;
    private casualNextCloudY = -160;
    private casualInputX = 0;
    private casualPointerStartX = 0;
    private casualPointerActive = false;
    private casualLastBounceCloud: Node | null = null;
    private casualLastCloudX = 0;
    private pausedFromCasual = false;
    private lastRunMode: 'run' | 'casual' = 'run';
    private shopTab: ShopTab = 'buy';
    private saveData: GameSave = { ...DEFAULT_SAVE, upgrades: { ...DEFAULT_UPGRADES }, inventory: { ...DEFAULT_INVENTORY }, unlockedSkins: ['classic'], settings: { ...DEFAULT_SETTINGS } };
    private latestLeaderboardEntry: LeaderboardEntry | null = null;
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
    private readonly highObstacleUnlockDistance = 200;
    private readonly missileUnlockDistance = 800;
    private readonly missileBaseCooldown = 7.4;
    private readonly turtleSpawnChance = 0.07;
    private readonly turtleShellSpeed = 1180;
    private readonly glideDecisionDelay = 0.11;
    private readonly jumpIntentDelay = 0.11;
    private readonly reviveAdDuration = 3;
    private readonly casualGravity = -1450;
    private readonly casualCloudUnit = 160;
    private readonly casualJumpVelocity = 835;
    private readonly casualBounceJumpMultiplier = 1.16;
    private readonly casualMoveSpeed = 380;
    private readonly casualDragDeadZone = 18;
    private readonly saveKey = 'hakimi_adventure_save_v2';
    private readonly oldBestKey = 'hakimi_adventure_best_score';
    private readonly coursePatterns: CoursePattern[] = [
        { length: 620, obstacles: [{ x: 230, kind: 'mushroom' }], coinArcs: [{ x: 360, y: 158, count: 5 }], coinPatterns: [{ x: 470, y: 230, kind: 'paw' }] },
        { length: 700, minDistance: 200, obstacles: [{ x: 290, kind: 'lowSign' }], coinArcs: [{ x: 92, y: 116, count: 4 }], coinPatterns: [{ x: 470, y: 160, kind: 'fish' }] },
        { length: 760, minDistance: 200, obstacles: [{ x: 300, kind: 'hangingBell' }], coinArcs: [{ x: 96, y: 104, count: 4 }, { x: 505, y: 108, count: 4 }] },
        { length: 680, obstacles: [{ x: 270, kind: 'spikes' }], coinArcs: [{ x: 90, y: 104, count: 5 }, { x: 430, y: 178, count: 5 }] },
        { length: 700, obstacles: [{ x: 300, kind: 'crate' }], coinArcs: [{ x: 110, y: 115, count: 5 }], coinPatterns: [{ x: 440, y: 230, kind: 'heart' }] },
        { length: 740, minDistance: 260, obstacles: [{ x: 280, kind: 'cactus' }], coinArcs: [{ x: 80, y: 125, count: 4 }], coinPatterns: [{ x: 470, y: 238, kind: 'star' }], powers: [{ x: 640, y: 230, kind: 'shield' }] },
        { length: 780, minDistance: 520, obstacles: [{ x: 300, kind: 'lowSign' }], coinPatterns: [{ x: 470, y: 160, kind: 'fish' }] },
        { length: 860, minDistance: 760, obstacles: [{ x: 220, kind: 'mushroom' }, { x: 560, kind: 'spikes' }], coinArcs: [{ x: 350, y: 220, count: 6 }] },
        { length: 920, minDistance: 980, obstacles: [{ x: 240, kind: 'crate' }, { x: 650, kind: 'cactus' }], coinPatterns: [{ x: 450, y: 250, kind: 'bigCat' }] },
        { length: 900, minDistance: 1200, obstacles: [{ x: 260, kind: 'hangingBell' }, { x: 650, kind: 'mushroom' }], coinArcs: [{ x: 145, y: 105, count: 4 }, { x: 510, y: 230, count: 5 }] },
        { length: 940, minDistance: 1500, obstacles: [{ x: 270, kind: 'mushroom' }, { x: 650, kind: 'spikes' }], coinArcs: [{ x: 130, y: 150, count: 5 }], coinPatterns: [{ x: 690, y: 235, kind: 'dog' }], powers: [{ x: 480, y: 238, kind: 'dash' }] },
        { length: 980, minDistance: 1800, obstacles: [{ x: 260, kind: 'cactus' }, { x: 690, kind: 'hangingBell' }], coinPatterns: [{ x: 430, y: 238, kind: 'crown' }] },
        { length: 1020, minDistance: 2150, obstacles: [{ x: 250, kind: 'crate' }, { x: 620, kind: 'spikes' }, { x: 930, kind: 'mushroom' }], coinArcs: [{ x: 110, y: 120, count: 5 }], coinPatterns: [{ x: 720, y: 240, kind: 'smile' }] },
        { length: 1040, minDistance: 2500, obstacles: [{ x: 280, kind: 'spikes' }, { x: 690, kind: 'cactus' }], coinPatterns: [{ x: 430, y: 250, kind: 'house' }] },
        { length: 1080, minDistance: 2900, obstacles: [{ x: 260, kind: 'lowSign' }, { x: 670, kind: 'crate' }], coinArcs: [{ x: 390, y: 165, count: 5 }], coinPatterns: [{ x: 820, y: 238, kind: 'cat' }] },
        { length: 1120, minDistance: 3300, obstacles: [{ x: 300, kind: 'cactus' }, { x: 760, kind: 'cactus' }], coinArcs: [{ x: 130, y: 110, count: 4 }], coinPatterns: [{ x: 560, y: 245, kind: 'bigCat' }], powers: [{ x: 920, y: 245, kind: 'dash' }] },
        { length: 1180, minDistance: 3800, obstacles: [{ x: 260, kind: 'crate' }, { x: 680, kind: 'spikes' }, { x: 1010, kind: 'lowSign' }], coinPatterns: [{ x: 470, y: 220, kind: 'star' }, { x: 860, y: 160, kind: 'fishboneBig' }] },
        { length: 1240, minDistance: 4300, obstacles: [{ x: 280, kind: 'lowSign' }, { x: 720, kind: 'mushroom' }, { x: 1080, kind: 'crate' }], coinArcs: [{ x: 130, y: 105, count: 4 }], coinPatterns: [{ x: 840, y: 260, kind: 'giantPaw' }], powers: [{ x: 1040, y: 245, kind: 'magnet' }] },
        { length: 1320, minDistance: 4800, obstacles: [{ x: 320, kind: 'hangingBell' }, { x: 860, kind: 'spikes' }], coinPatterns: [{ x: 610, y: 265, kind: 'megaCat' }] },
        { length: 1260, minDistance: 5400, obstacles: [{ x: 260, kind: 'crate' }, { x: 720, kind: 'hangingBell' }], coinPatterns: [{ x: 520, y: 225, kind: 'ribbon' }], powers: [{ x: 1020, y: 245, kind: 'score' }] },
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
        input.off(Input.EventType.TOUCH_MOVE, this.onPressMove, this);
        input.off(Input.EventType.TOUCH_END, this.onPressEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onPressEnd, this);
        input.off(Input.EventType.MOUSE_DOWN, this.onPressStart, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onPressMove, this);
        input.off(Input.EventType.MOUSE_UP, this.onPressEnd, this);
    }

    public update(dt: number): void {
        if (!this.textures || !this.runner) {
            return;
        }
        const running = this.state === 'playing';
        const casualRunning = this.state === 'casual';
        this.runner.tick(dt, running);
        if (casualRunning) {
            this.updateCasualMode(dt);
            return;
        }
        if (this.state === 'revive') {
            this.updateReviveAd(dt);
            return;
        }
        if (!running) {
            return;
        }
        this.updateAirActionDecision(dt);

        this.tickPowers(dt);
        this.endInvincibleDashIfNeeded();
        this.updatePowerEffects(dt);
        const dashBoost = this.powers.dash > 0 ? 1.55 : 1;
        const speedProgress = 1 - Math.exp(-this.distance / 3600);
        const targetSpeed = this.baseSpeed + (this.maxSpeed - this.baseSpeed) * speedProgress;
        this.speed += (Math.min(this.maxSpeed, targetSpeed) - this.speed) * Math.min(1, dt * 0.55);
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
        this.updateTurtleShells(dt);
        this.updateFlyingCoins(dt);
        this.updateFishProjectiles(dt);
        this.updateInvincibleDash(dt);
        this.clearDashThreats();
        this.applyMagnet(dt);
        this.spawnWhileNeeded();
        this.maybeSpawnMissile(dt);
        this.checkCollectibles();
        this.checkObstacles();
        this.checkMissiles();
        this.updateHud();
        this.checkAchievementsNow();
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
        this.createParallaxLayer(bgRoot, 'SeamlessKawaiiBackground', this.textures.seamlessBg, 0.18, 1280, backgroundVisibleHeight, this.surfaceY + backgroundVisibleHeight * 0.5);

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
        this.casualRoot = this.makeNode('CasualMode', this.worldRoot, Vec3.ZERO);
        this.casualRoot.active = false;
        this.player = this.makeSprite('HakimiRunner', this.worldRoot, this.textures.runner, 172, 172, new Vec3(this.playerX, this.playerGroundY, 0));
        this.playerFxRoot = this.makeNode('PlayerFxRoot', this.player, Vec3.ZERO);
        this.buildPlayerEffects();
        const playerSprite = this.player.getComponent(Sprite);
        this.runner = this.player.addComponent(RunnerController);
        this.runner.groundY = this.playerGroundY;
        this.runner.jumpVelocity = 1190;
        this.runner.doubleJumpVelocity = 1060;
        if (playerSprite) {
            const skinFrames = this.currentSkinFrames();
            this.runner.setupAnimation(
                playerSprite,
                skinFrames.run,
                skinFrames.jump,
                skinFrames.slide,
                skinFrames.fall,
                skinFrames.glide,
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
            reviveTicket: this.textures.reviveTicket,
            activeItemBase: this.textures.activeItemBase,
            achievementStar: this.textures.achievementStar,
            achievementIcons: this.textures.achievementIcons,
            resultBg: this.textures.resultBg,
            resultPanel: this.textures.resultPanel,
            resultScore: this.textures.resultScore,
            resultCoin: this.textures.resultCoin,
            resultDistance: this.textures.resultDistance,
            resultBest: this.textures.resultBest,
            menuBestPanel: this.textures.menuBestPanel,
            hudStatsPanel: this.textures.hudStatsPanel,
            shopPanel: this.textures.shopPanel,
            achievementPanel: this.textures.achievementPanel,
            settingsPanel: this.textures.settingsPanel,
            pausePanel: this.textures.pausePanel,
            leaderboardPanel: this.textures.leaderboardPanel,
            cloudNormal: this.textures.cloudNormal,
            cloudBreak: this.textures.cloudBreak,
            cloudBounce: this.textures.cloudBounce,
        };
        this.hud.build(this.textures.button, this.textures.panel, this.textures.logo, icons, this.textures.uiFont);
        this.feedbackRoot = this.makeNode('FeedbackRoot', uiRoot, Vec3.ZERO);
        this.feedback = this.feedbackRoot.addComponent(FeedbackManager);
        this.feedback.setup(this.textures.coin);
        this.applySettings();
        this.bindHudButtons();
        this.makeLabel('VersionLabel', 'Demo v1 - Cocos Creator 3.8.8', 18, new Vec3(465, -328, 0), new Color(105, 119, 132, 190), uiRoot);
    }

    private updateAirActionDecision(dt: number): void {
        if (!this.runner) {
            return;
        }
        if (this.jumpIntentTimer >= 0) {
            this.jumpIntentTimer -= dt;
            if (this.jumpIntentTimer <= 0) {
                if (this.spaceHeld && this.runner.isAirborne) {
                    this.runner.startGlide();
                }
                this.jumpIntentTimer = -1;
            }
        }
        if (this.touchJumpIntentTimer >= 0) {
            this.touchJumpIntentTimer -= dt;
            if (this.touchJumpIntentTimer <= 0) {
                if (this.touchHeld && this.runner.isAirborne) {
                    this.runner.startGlide();
                }
                this.touchJumpIntentTimer = -1;
            }
        }
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
        addButton(this.hud?.getCasualNode() ?? null, this.onCasualPressed);
        addButton(this.hud?.getSettingsNode() ?? null, this.onSettingsPressed);
        addButton(this.hud?.getUpgradeNode() ?? null, this.onUpgradePressed);
        addButton(this.hud?.getAchievementsNode() ?? null, this.onAchievementsPressed);
        addButton(this.hud?.getLeaderboardNode() ?? null, this.onLeaderboardPressed);
        addButton(this.hud?.getPauseNode() ?? null, this.onPausePressed);
        addButton(this.hud?.getActiveItemNode() ?? null, this.onActiveItemPressed);
        addButton(this.hud?.getContinueNode() ?? null, this.onContinuePressed);
        addButton(this.hud?.getMenuNode() ?? null, this.onMenuPressed);
        addButton(this.hud?.getSettingsBackNode() ?? null, this.onBackPressed);
        addButton(this.hud?.getSettingsLanguageNode() ?? null, this.onSettingsLanguagePressed);
        addButton(this.hud?.getSettingsBgmMinusNode() ?? null, () => this.adjustBgmVolume(-0.1));
        addButton(this.hud?.getSettingsBgmPlusNode() ?? null, () => this.adjustBgmVolume(0.1));
        addButton(this.hud?.getSettingsSfxMinusNode() ?? null, () => this.adjustSfxVolume(-0.1));
        addButton(this.hud?.getSettingsSfxPlusNode() ?? null, () => this.adjustSfxVolume(0.1));
        addButton(this.hud?.getSettingsAssistNode() ?? null, this.onSettingsAssistPressed);
        addButton(this.hud?.getSettingsResetSaveNode() ?? null, this.onSettingsResetSavePressed);
        addButton(this.hud?.getSettingsResetRankNode() ?? null, this.onSettingsResetRankPressed);
        addButton(this.hud?.getUpgradeBackNode() ?? null, this.onBackPressed);
        addButton(this.hud?.getAchievementsBackNode() ?? null, this.onBackPressed);
        for (const tab of ['buy', 'upgrade', 'character', 'skin'] as ShopTab[]) {
            addButton(this.hud?.getShopTabNode(tab) ?? null, () => this.onShopTabPressed(tab));
        }
        addButton(this.hud?.getLeaderboardBackNode() ?? null, this.onLeaderboardBackPressed);
        addButton(this.hud?.getReviveAdNode() ?? null, this.onReviveAdPressed);
        addButton(this.hud?.getReviveGiveUpNode() ?? null, this.onReviveGiveUpPressed);
        addButton(this.hud?.getRetryNode() ?? null, this.onRetryPressed);
        addButton(this.hud?.getResultMenuNode() ?? null, this.onMenuPressed);
        addButton(this.hud?.getResultShopNode() ?? null, this.onUpgradePressed);
        addButton(this.hud?.getResultLeaderboardNode() ?? null, this.onLeaderboardPressed);
        for (const kind of POWER_KINDS) {
            addButton(this.hud?.getUpgradeButton(kind) ?? null, () => this.buyUpgrade(kind));
        }
        for (const kind of Object.keys(DEFAULT_INVENTORY) as ConsumableKind[]) {
            addButton(this.hud?.getConsumableButton(kind) ?? null, () => this.buyConsumable(kind));
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
        parallax.overlap = 2;
        this.parallaxLayers.push(parallax);
        for (let i = -2; i <= 2; i++) {
            this.makeSprite(`${name}_${i + 2}`, layer, frame, width, height, new Vec3(i * (width - parallax.overlap), 0, 0));
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
        this.missileBlocks = 0;
        this.missileDodges = 0;
        this.slideDodges = 0;
        this.turtleStomps = 0;
        this.turtleClears = 0;
        this.bestTurtleShellClears = 0;
        this.flyingCoinsCollected = 0;
        this.powerupsCollected = 0;
        this.goldCoinsCollected = 0;
        this.silverCoinsCollected = 0;
        this.bronzeCoinsCollected = 0;
        this.casualCloudTriggers = 0;
        this.casualBreakClouds = 0;
        this.casualJumpChain = 0;
        this.casualBestJumpChain = 0;
        this.reviveUsed = false;
        this.reviveAdTimer = 0;
        this.missionToastShown = {};
        this.nextSpawnX = 700;
        this.missileCooldown = 3.8;
        this.spaceHeld = false;
        this.touchHeld = false;
        this.pendingSpaceAirAction = -1;
        this.pendingTouchAirAction = -1;
        this.jumpIntentTimer = -1;
        this.touchJumpIntentTimer = -1;
        this.powers = { magnet: 0, shield: 0, score: 0, dash: 0 };
        this.heldActiveItem = null;
        this.dashWasActive = false;
        this.hud?.setReviveAdProgress(false);
        this.hud?.setActiveItem(null);
        this.updatePowerEffects(0);
        this.obstacles.length = 0;
        this.collectibles.length = 0;
        this.missiles.length = 0;
        this.turtleShells.length = 0;
        this.flyingCoins.length = 0;
        this.fishProjectiles.length = 0;
        this.obstacleRoot?.removeAllChildren();
        this.itemRoot?.removeAllChildren();
        this.missileRoot?.removeAllChildren();
        this.clearCasualMode();
        this.runner?.reset(this.playerX);
        if (this.player) {
            this.player.active = true;
        }
        this.updateHud();
        this.checkAchievementsNow();
    }

    private showMenu(): void {
        this.state = 'menu';
        this.latestLeaderboardEntry = null;
        this.resetRunData();
        this.hud?.setMenu(this.saveView(), this.skinViews());
        this.audioManager?.playBgm('audio/background');
    }

    private showSettings(): void {
        this.state = 'settings';
        this.hud?.setSettings(this.settingsView());
    }

    private showUpgrade(): void {
        this.state = 'upgrade';
        this.hud?.setUpgrade(this.saveView(), this.skinViews(), this.upgradeCosts(), this.consumableViews(), this.shopTab);
    }

    private showAchievements(): void {
        this.state = 'achievements';
        this.hud?.setAchievements(this.saveView(), this.achievementViews());
    }

    private startRun(): void {
        if (this.state === 'playing') {
            return;
        }
        this.lastRunMode = 'run';
        this.resetRunData();
        if (this.casualRoot) {
            this.casualRoot.active = false;
        }
        if (this.player) {
            this.player.active = true;
        }
        this.spawnInitialCourse();
        this.state = 'playing';
        this.hud?.setPlaying();
        this.applyStartConsumables();
        this.feedback?.showText(this.t('\u51fa\u53d1\uff01', 'Go!'), new Vec3(0, 20, 0), new Color(255, 152, 84, 255), 34);
        if (this.saveData.settings.assistHints) {
            this.feedback?.showText(this.t('\u7a7a\u683c\u8df3\u8dc3  \u957f\u6309\u6ed1\u7fd4  S\u4e0b\u6ed1', 'Space jump  Hold glide  S slide'), new Vec3(0, -26, 0), new Color(74, 112, 143, 235), 20);
        }
        this.audioManager?.playBgm('audio/background');
        this.audioManager?.playSfx('start');
    }

    private startCasualMode(): void {
        if (this.state === 'casual') {
            return;
        }
        this.lastRunMode = 'casual';
        this.resetRunData();
        this.state = 'casual';
        this.hud?.setPlaying();
        this.setupCasualMode();
        this.feedback?.showText(this.t('\u4f11\u95f2\u6a21\u5f0f\uff01', 'Casual mode!'), new Vec3(0, 20, 0), new Color(255, 152, 84, 255), 34);
        if (this.saveData.settings.assistHints) {
            this.feedback?.showText(this.t('\u65b9\u5411\u952e\u79fb\u52a8  \u4e0a\u7a7f\u4e91\u6735\u8df3\u8dc3', 'Move with arrows, rise through clouds'), new Vec3(0, -26, 0), new Color(74, 112, 143, 235), 20);
        }
        this.audioManager?.playBgm('audio/background');
        this.audioManager?.playSfx('start');
    }

    private pauseRun(): void {
        if (this.state !== 'playing' && this.state !== 'casual') {
            return;
        }
        this.pausedFromCasual = this.state === 'casual';
        this.state = 'pause';
        this.hud?.setPause();
    }

    private resumeRun(): void {
        if (this.state !== 'pause') {
            return;
        }
        this.state = this.pausedFromCasual ? 'casual' : 'playing';
        this.hud?.setPlaying();
    }

    public setBgmVolume(volume: number): void {
        this.saveData.settings.bgmVolume = this.clamp01(volume);
        this.audioManager?.setBgmVolume(volume);
        this.saveGame();
        this.hud?.updateSettings(this.settingsView());
    }

    public setSfxVolume(volume: number): void {
        this.saveData.settings.sfxVolume = this.clamp01(volume);
        this.audioManager?.setSfxVolume(volume);
        this.saveGame();
        this.hud?.updateSettings(this.settingsView());
    }

    private gameOver(): void {
        if (this.state !== 'playing' && this.state !== 'casual' && this.state !== 'revive') {
            return;
        }
        this.state = 'gameover';
        const finalScore = Math.floor(this.score);
        const baseReward = this.runCoins + Math.floor(this.distance / 120);
        const missions = this.missionViews();
        const missionReward = missions.reduce((sum, mission) => sum + (mission.completed ? mission.reward : 0), 0);
        const reward = baseReward + missionReward;
        this.saveData.totalCoins += reward;
        this.saveData.totalRuns += 1;
        this.saveData.totalDistance += Math.floor(this.distance);
        this.updateBestScores(finalScore);
        this.saveData.missionsCompleted += missions.filter((mission) => mission.completed).length;
        const newAchievements = this.unlockedAchievements(finalScore, this.saveData.totalCoins);
        this.checkAchievementsNow(this.saveData.totalCoins, true);
        const rank = this.recordLeaderboard(finalScore);
        this.saveGame();
        this.hud?.setGameOver({
            score: finalScore,
            runCoins: this.runCoins,
            totalCoins: this.saveData.totalCoins,
            distance: this.distance,
            bestScore: this.saveData.bestScore,
            reward,
            rank,
            missions,
            achievements: newAchievements,
            leaderboard: this.leaderboardView(10, this.latestLeaderboardEntry),
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
        this.spawnIntroCoinBillboard(960, this.surfaceY + 292);
        this.spawnPowerup(2180, 'magnet', 180);
        this.spawnPowerup(2440, 'shield', 190);
        this.nextSpawnX = 3300;
        this.spawnWhileNeeded();
    }

    private setupCasualMode(): void {
        if (!this.textures || !this.casualRoot || !this.player) {
            return;
        }
        this.clearCasualMode();
        this.obstacleRoot?.removeAllChildren();
        this.itemRoot?.removeAllChildren();
        this.missileRoot?.removeAllChildren();
        this.casualRoot.active = true;
        this.player.active = true;
        const sprite = this.player.getComponent(Sprite);
        if (sprite) {
            sprite.spriteFrame = this.textures.runner;
        }
        this.player.setPosition(0, -120, 0);
        this.player.setScale(0.9, 0.9, 1);
        this.player.angle = 0;
        this.casualVelocityY = this.casualJumpVelocity;
        this.casualHighestStep = 0;
        this.casualLastPlayerY = this.player.position.y;
        this.casualNextCloudY = -50;
        this.casualInputX = 0;
        this.casualPointerActive = false;
        this.casualLastBounceCloud = null;
        this.casualLastCloudX = 0;
        const startXs = [0, -120, 80, 210, 60, -80, -220, -40];
        for (const x of startXs) {
            this.spawnCasualCloud(x, this.casualNextCloudY, 'normal');
            this.casualNextCloudY += this.casualCloudUnit;
        }
    }

    private clearCasualMode(): void {
        this.casualRoot?.removeAllChildren();
        this.casualClouds.length = 0;
        this.casualPlayer = null;
        this.casualVelocityY = 0;
        this.casualHighestStep = 0;
        this.casualLastPlayerY = 0;
        this.casualNextCloudY = -160;
        this.casualInputX = 0;
        this.casualPointerActive = false;
        this.casualLastBounceCloud = null;
        this.casualLastCloudX = 0;
        if (this.casualRoot) {
            this.casualRoot.active = false;
        }
    }

    private updateCasualMode(dt: number): void {
        if (!this.player || !this.casualRoot || !this.textures) {
            return;
        }
        this.casualLastPlayerY = this.player.position.y;
        const pos = this.player.position.clone();
        pos.x += this.casualInputX * this.casualMoveSpeed * dt;
        if (pos.x < -650) pos.x = 650;
        if (pos.x > 650) pos.x = -650;
        this.casualVelocityY += this.casualGravity * dt;
        pos.y += this.casualVelocityY * dt;
        this.player.setPosition(pos);

        for (const cloud of this.casualClouds) {
            if (!cloud.node.isValid) {
                continue;
            }
            if (cloud.kind === 'moving') {
                const cpos = cloud.node.position.clone();
                cpos.x += cloud.moveDir * cloud.moveSpeed * dt;
                if (Math.abs(cpos.x - cloud.baseX) > 120) {
                    cloud.moveDir *= -1;
                }
                cloud.node.setPosition(cpos);
            }
        }

        this.checkCasualCloudCrossing();
        if (this.player.position.y > 86) {
            const shift = this.player.position.y - 86;
            this.player.setPosition(this.player.position.x, 86, 0);
            for (const cloud of this.casualClouds) {
                if (!cloud.node.isValid) {
                    continue;
                }
                cloud.node.setPosition(cloud.node.position.x, cloud.node.position.y - shift, 0);
            }
            this.casualNextCloudY -= shift;
        }
        if (this.player.position.y < -390) {
            this.gameOver();
            return;
        }
        while (this.casualNextCloudY < 390) {
            const stage = Math.floor(this.casualHighestStep / 10);
            const kind = this.pickCasualCloudKind(stage);
            const reach = Math.max(130, 190 - Math.min(48, stage * 6));
            const x = Math.max(-440, Math.min(440, this.casualLastCloudX + this.randomRange(-reach, reach)));
            this.spawnCasualCloud(x, this.casualNextCloudY, kind);
            this.casualNextCloudY += this.casualCloudUnit + this.randomRange(-10, 14);
        }
        this.casualClouds = this.casualClouds.filter((cloud) => {
            if (!cloud.node.isValid) {
                return false;
            }
            if (cloud.node.position.y < -430) {
                cloud.node.destroy();
                return false;
            }
            return true;
        });
        this.updateHud();
    }

    private checkCasualCloudCrossing(): void {
        if (!this.player) {
            return;
        }
        const px = this.player.position.x;
        const py = this.player.position.y;
        const movingUp = this.casualVelocityY > 0;
        const movingDown = this.casualVelocityY < 0;
        if (this.casualLastBounceCloud && (!this.casualLastBounceCloud.isValid || py > this.casualLastBounceCloud.position.y + this.casualCloudUnit * 0.6)) {
            this.casualLastBounceCloud = null;
        }
        for (const cloud of this.casualClouds) {
            if (!cloud.node.isValid || (cloud.used && cloud.kind === 'break')) {
                continue;
            }
            const cpos = cloud.node.position;
            const triggerY = cpos.y;
            const top = cpos.y + cloud.height * 0.22;
            const previousFootY = this.casualLastPlayerY - 58;
            const currentFootY = py - 58;
            const crossedUp = movingUp && this.casualLastPlayerY <= triggerY && py >= triggerY && py <= triggerY + cloud.height * 0.72;
            const crossedDown = movingDown && previousFootY >= top && currentFootY <= top && currentFootY >= top - 82;
            const inX = Math.abs(px - cpos.x) <= cloud.width * 0.58 + 28;
            if ((!crossedUp && !crossedDown) || !inX) {
                continue;
            }
            if (cloud.kind === 'break') {
                cloud.used = true;
            }
            this.casualCloudTriggers += 1;
            this.casualJumpChain += 1;
            this.casualBestJumpChain = Math.max(this.casualBestJumpChain, this.casualJumpChain);
            if (cloud.kind === 'break') {
                this.casualBreakClouds += 1;
            }
            this.casualLastBounceCloud = cloud.kind === 'break' ? null : cloud.node;
            this.casualVelocityY = cloud.kind === 'bounce' ? this.casualJumpVelocity * this.casualBounceJumpMultiplier : this.casualJumpVelocity;
            if (crossedDown) {
                this.player.setPosition(px, top + 58, 0);
            }
            const reward = cloud.kind === 'bounce' ? 260 : cloud.kind === 'break' ? 210 : cloud.kind === 'moving' ? 180 : 120;
            this.score += reward;
            this.casualHighestStep += 1;
            this.distance = this.casualHighestStep;
            this.feedback?.showText(`+${reward}`, new Vec3(cpos.x, cpos.y + 48, 0), new Color(255, 152, 84, 255), 22);
            if (cloud.kind === 'break') {
                this.casualClouds = this.casualClouds.filter((item) => item !== cloud);
                tween(cloud.node)
                    .to(0.12, { scale: new Vec3(0.86, 0.62, 1) })
                    .call(() => {
                        cloud.node.destroy();
                    })
                    .start();
            } else if (cloud.kind === 'bounce') {
                tween(cloud.node)
                    .to(0.08, { scale: new Vec3(1.08, 0.86, 1) })
                    .to(0.1, { scale: new Vec3(1, 1, 1) })
                    .start();
            }
            return;
        }
    }

    private pickCasualCloudKind(stage: number): CasualCloudKind {
        const roll = Math.random();
        if (stage >= 5 && roll < 0.14) return 'bounce';
        if (stage >= 3 && roll < 0.34) return 'break';
        if (stage >= 2 && roll < 0.58) return 'moving';
        return 'normal';
    }

    private spawnCasualCloud(x: number, y: number, kind: CasualCloudKind): void {
        if (!this.textures || !this.casualRoot) {
            return;
        }
        const frame = kind === 'break' ? this.textures.cloudBreak : kind === 'bounce' ? this.textures.cloudBounce : this.textures.cloudNormal;
        const width = kind === 'bounce' ? 176 : 162;
        const height = kind === 'bounce' ? 112 : 72;
        const node = this.makeSprite(`CasualCloud_${kind}`, this.casualRoot, frame, width, height, new Vec3(x, y, 0));
        this.casualLastCloudX = x;
        this.casualClouds.push({
            node,
            kind,
            width,
            height,
            used: false,
            moveDir: Math.random() < 0.5 ? -1 : 1,
            moveSpeed: 58 + Math.random() * 46,
            baseX: x,
        });
    }

    private spawnWhileNeeded(): void {
        while (this.nextSpawnX < 1480) {
            const pattern = this.pickCoursePattern();
            const baseX = this.nextSpawnX;
            let previousObstacleX = -Infinity;
            for (const obstacle of pattern.obstacles ?? []) {
                if (this.isSlideObstacleKind(obstacle.kind) && this.distance < this.highObstacleUnlockDistance) {
                    continue;
                }
                const jitter = this.randomRange(-this.samePatternJitter, this.samePatternJitter);
                const localX = Math.max(obstacle.x + jitter, previousObstacleX + this.minObstacleGap);
                previousObstacleX = localX;
                this.spawnObstacle(baseX + localX, this.pickSpawnedObstacleKind(obstacle.kind));
            }
            for (const arc of pattern.coinArcs ?? []) {
                this.spawnCoinArc(baseX + arc.x, arc.y, arc.count);
            }
            for (const coinPattern of pattern.coinPatterns ?? []) {
                this.spawnCoinPattern(baseX + coinPattern.x, this.surfaceY + coinPattern.y, coinPattern.kind);
            }
            for (const power of pattern.powers ?? []) {
                if (Math.random() < this.powerSpawnChance(power.kind)) {
                    this.spawnPowerup(baseX + power.x, power.kind, power.y);
                }
            }
            this.maybeSpawnActiveItem(baseX, pattern.length);
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
            turtle: { frame: this.textures.turtleNormal, width: 146, height: 74, y: this.surfaceY + 37, padX: 18, padY: 12, passType: 'jump' as ObstaclePassType },
            lowSign: { frame: this.textures.lowSign, width: 136, height: 104, y: this.surfaceY + 132, padX: 24, padY: 20, passType: 'slide' as ObstaclePassType },
            hangingBell: { frame: this.textures.hangingBell, width: 104, height: 142, y: this.surfaceY + 150, padX: 18, padY: 26, passType: 'slide' as ObstaclePassType },
        }[kind];
        const node = this.makeSprite(`Obstacle_${kind}`, this.obstacleRoot, data.frame, data.width, data.height, new Vec3(x, data.y, 0));
        const obstacle = node.addComponent(Obstacle);
        obstacle.hitPaddingX = data.padX;
        obstacle.hitPaddingY = data.padY;
        obstacle.passType = data.passType;
        obstacle.obstacleKind = kind;
        this.obstacles.push(obstacle);
    }

    private pickSpawnedObstacleKind(kind: ObstacleKind): ObstacleKind {
        if (!this.isLowObstacleKind(kind) || Math.random() >= this.turtleSpawnChance) {
            return kind;
        }
        return 'turtle';
    }

    private isLowObstacleKind(kind: ObstacleKind): boolean {
        return kind === 'mushroom' || kind === 'cactus' || kind === 'crate' || kind === 'spikes' || kind === 'turtle';
    }

    private isSlideObstacleKind(kind: ObstacleKind): boolean {
        return kind === 'lowSign' || kind === 'hangingBell';
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
        type CoinPoint = [number, number, CoinTone?];
        const maps: Record<CoinPatternKind, CoinPoint[]> = {
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
            megaCat: this.coinBitmap([
                'BGGSSSSGGB',
                'GGGSGGSGGG',
                'GGGGGGGGGG',
                'GSSGGGGSSG',
                'GGGGSSGGGG',
                'GSGSGGSGSG',
                'BGSSSSSSGB',
                'GGGSGGSGGG',
                'GGGGSSGGGG',
            ]),
            giantPaw: this.coinBitmap([
                '..GG..GG..',
                '.GGGGGGGG.',
                'GG..GG..GG',
                '..GGGGGG..',
                '.GGSSSSGG.',
                'GGSSGGSSGG',
                '.GGSSSSGG.',
            ]),
            fishboneBig: this.coinBitmap([
                'G...G...G',
                '.G.G.G.G.',
                '..GGGGG..',
                'GGSSSSSGG',
                '..GGGGG..',
                '.G.G.G.G.',
                'G...G...G',
            ]),
            ribbon: this.coinBitmap([
                'BGG...GGB',
                'GSGG.GGSG',
                'GGSSSSSGG',
                '..GGGGG..',
                'GGSSSSSGG',
                'GSGG.GGSG',
                'BGG...GGB',
            ]),
            one: this.coinBitmap([
                '..S..',
                '.SS..',
                '..S..',
                '..S..',
                '..S..',
                '.SSS.',
            ]),
            two: this.coinBitmap([
                '.SSS.',
                'S...S',
                '...S.',
                '..S..',
                '.S...',
                'SSSSS',
            ]),
            three: this.coinBitmap([
                'SSSS.',
                '....S',
                '..SS.',
                '....S',
                'S...S',
                '.SSS.',
            ]),
            go: this.coinBitmap([
                '.SSS...SSS.',
                'S.....S...S',
                'S.SS..S...S',
                'S..S..S...S',
                '.SSS...SSS.',
            ]),
        };
        const points = maps[kind];
        const step = kind === 'megaCat' ? 42 : (kind === 'bigCat' || kind === 'giantPaw' || kind === 'fishboneBig' || kind === 'ribbon' ? 34 : 38);
        const width = Math.max(...points.map((point) => point[0])) * step;
        const height = Math.max(...points.map((point) => point[1])) * step;
        for (const [gridX, gridY] of points) {
            this.spawnCollectible(x + gridX * step - width * 0.5, y - gridY * step + height * 0.5, 'coin');
        }
    }

    private coinBitmap(rows: string[]): Array<[number, number, CoinTone?]> {
        const points: Array<[number, number, CoinTone?]> = [];
        rows.forEach((row, y) => {
            [...row].forEach((cell, x) => {
                if (cell === 'G') points.push([x, y, 'gold']);
                if (cell === 'S') points.push([x, y, 'silver']);
                if (cell === 'B') points.push([x, y, 'bronze']);
            });
        });
        return points;
    }

    private spawnIntroCoinBillboard(x: number, y: number): void {
        const rows = [
            '□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□',
            '□□□□□■■■■■□□□□■■■■□□□□■□□□□□□■■■■■□□□■■■■■□□□□□',
            '□□□□□□□□□■□□□□□□□■□□□■■□□□□□□■□□□□□□□■□□□■□□□□□',
            '□□□□□□□□□■□□□□□□□■□□□□■□□□□□□■□□□□□□□■□□□■□□□□□',
            '□□□□□■■■■■□□□□■■■■□□□□■□□□□□□■□■■■□□□■□□□■□□□□□',
            '□□□□□□□□□■□□□□■□□□□□□□■□□□□□□■□□□■□□□■□□□■□□□□□',
            '□□□□□□□□□■□□□□■□□□□□□□■□□□□□□■□□□■□□□■□□□■□□□□□',
            '□□□□□■■■■■□□□□■■■■■□□■■■□□□□□■■■■■□□□■■■■■□□□□□',
            '□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□',
        ];
        const step = 30;
        const width = rows[0].length * step;
        const height = rows.length * step;
        rows.forEach((row, rowIndex) => {
            [...row].forEach((cell, colIndex) => {
                if (cell !== '□' && cell !== '■') {
                    return;
                }
                const tone: CoinTone = cell === '■' ? 'silver' : 'gold';
                this.spawnCollectible(x + colIndex * step - width * 0.5, y - rowIndex * step + height * 0.5, 'coin', tone);
            });
        });
    }

    private spawnPowerup(x: number, kind: CollectibleKind, yFromGround: number): void {
        if (kind === 'coin') {
            return;
        }
        this.spawnCollectible(x, this.surfaceY + yFromGround, kind);
    }

    private maybeSpawnActiveItem(baseX: number, patternLength: number): void {
        if (this.distance < 400 || Math.random() > 0.18) {
            return;
        }
        const kind: ActiveItemKind = Math.random() < 0.55 ? 'fishDart' : 'mysteryBox';
        const x = baseX + Math.max(300, Math.min(patternLength - 150, patternLength * this.randomRange(0.38, 0.78)));
        const y = 186 + this.randomRange(-22, 32);
        this.spawnPowerup(x, kind, y);
    }

    private powerSpawnChance(kind: CollectibleKind): number {
        if (kind === 'coin') {
            return 1;
        }
        if (this.isActiveItemKind(kind)) {
            return 0.2;
        }
        const stageBonus = Math.min(0.14, this.currentStage() * 0.018);
        if (kind === 'dash') return 0.24 + stageBonus;
        if (kind === 'shield') return 0.26 + stageBonus;
        if (kind === 'score') return 0.28 + stageBonus;
        return 0.24 + stageBonus;
    }

    private isActiveItemKind(kind: CollectibleKind): kind is ActiveItemKind {
        return kind === 'fishDart' || kind === 'mysteryBox';
    }

    private spawnCollectible(x: number, y: number, kind: CollectibleKind, tone?: CoinTone): void {
        if (!this.textures || !this.itemRoot) {
            return;
        }
        const coinTone = kind === 'coin' ? (tone ?? this.currentCourseCoinTone()) : 'gold';
        const frame = this.frameForCollectible(kind, coinTone);
        const size = kind === 'coin' ? 32 : (this.isActiveItemKind(kind) ? 52 : 44);
        const node = this.makeSprite(kind === 'coin' ? 'Coin' : `Power_${kind}`, this.itemRoot, frame, size, size, new Vec3(x, y, 0));
        const collectible = node.addComponent(Collectible);
        collectible.kind = kind;
        collectible.value = kind === 'coin' ? 1 : 0;
        collectible.coinTone = kind === 'coin' ? coinTone : '';
        collectible.reset();
        this.collectibles.push(collectible);
        if (kind !== 'coin') {
            node.angle = Math.random() * 8 - 4;
        }
    }

    private currentCourseCoinTone(): CoinTone {
        if (this.distance >= 1500) {
            return 'gold';
        }
        if (this.distance >= 1000) {
            return 'silver';
        }
        return 'bronze';
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
        const dashActive = this.powers.dash > 0;
        if (!this.player || (this.powers.magnet <= 0 && !dashActive)) {
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
            const range = dashActive ? 9999 : 330 + this.saveData.upgrades.magnet * 18;
            if (dist < range) {
                const pull = dashActive ? 14 : 8.5;
                pos.x += dx * Math.min(1, dt * pull);
                pos.y += dy * Math.min(1, dt * pull);
                item.node.setPosition(pos);
            }
        }
    }

    private beginInvincibleDash(): void {
        this.dashWasActive = true;
        this.runner?.beginInvincibleDash();
    }

    private updateInvincibleDash(dt: number): void {
        if (!this.player || this.powers.dash <= 0) {
            return;
        }
        const targetY = this.playerGroundY + 224;
        const pos = this.player.position.clone();
        pos.y += (targetY - pos.y) * Math.min(1, dt * 8.5);
        pos.x = this.playerX;
        this.player.setPosition(pos);
        this.runner?.holdInvincibleDashY(pos.y);
    }

    private endInvincibleDashIfNeeded(): void {
        if (!this.dashWasActive || this.powers.dash > 0) {
            return;
        }
        this.dashWasActive = false;
        this.runner?.endInvincibleDash();
    }

    private clearDashThreats(): void {
        if (this.powers.dash <= 0) {
            return;
        }
        for (const obstacle of this.obstacles) {
            if (!obstacle.node.active) {
                continue;
            }
            const x = obstacle.node.position.x;
            if (x < this.playerX - 90 || x > this.playerX + 168) {
                continue;
            }
            const pos = obstacle.node.position.clone();
            obstacle.node.active = false;
            obstacle.node.destroy();
            this.spawnFlyingCoins(pos, 2);
            this.score += 180 * this.currentMultiplier();
            this.feedback?.showText(this.t('\u65e0\u654c\u51b2\u7834 +180', 'Invincible dash +180'), pos.add(new Vec3(0, 60, 0)), new Color(113, 142, 236, 255), 22);
        }
        for (const missile of this.missiles) {
            if (missile.state !== 'flying' || missile.hit || !missile.missileNode?.active) {
                continue;
            }
            const x = missile.missileNode.position.x;
            if (x < this.playerX - 120 || x > this.playerX + 190) {
                continue;
            }
            missile.hit = true;
            const pos = missile.missileNode.position.clone();
            missile.missileNode.active = false;
            missile.missileNode.destroy();
            missile.trailNode?.destroy();
            this.missileBlocks += 1;
            this.score += 220 * this.currentMultiplier();
            this.feedback?.showText(this.t('\u65e0\u654c\u51fb\u843d +220', 'Dash cleared +220'), pos.add(new Vec3(0, 48, 0)), new Color(113, 142, 236, 255), 22);
        }
        this.obstacles = this.obstacles.filter((obstacle) => obstacle.node.isValid && obstacle.node.active);
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
                this.recordCollectedCoin(collectible, value);
                this.combo += value;
                this.recordCombo();
                this.comboTimer = 2.2;
                this.score += (100 + Math.min(300, this.combo * 8)) * value * this.currentMultiplier();
                this.audioManager?.playSfx('coin');
            } else {
                collectible.collect();
                this.powerupsCollected += 1;
                if (this.isActiveItemKind(collectible.kind)) {
                    this.setHeldActiveItem(collectible.kind);
                    this.audioManager?.playSfx('powerup');
                    this.feedback?.showText(this.activeItemName(collectible.kind), itemPos, new Color(255, 152, 84, 255), 28);
                    continue;
                }
                this.activatePower(collectible.kind);
                this.audioManager?.playSfx('powerup');
                this.feedback?.showText(`${this.powerName(collectible.kind)}!`, itemPos, new Color(106, 166, 214, 255), 28);
            }
        }
    }

    private recordCollectedCoin(collectible: Collectible, value: number): void {
        if (value <= 0) {
            return;
        }
        if (collectible.isFlyingCoin) {
            this.flyingCoinsCollected += value;
        }
        if (collectible.coinTone === 'silver') {
            this.silverCoinsCollected += value;
        } else if (collectible.coinTone === 'bronze') {
            this.bronzeCoinsCollected += value;
        } else {
            this.goldCoinsCollected += value;
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
                this.feedback?.showText(this.t('\u5b8c\u7f8e\u8d8a\u8fc7 +80', 'Clean dodge +80'), new Vec3(this.playerX + 30, this.playerGroundY + 116, 0), new Color(255, 152, 84, 255), 24);
                continue;
            }
            if (!playerBox.intersects(obstacle.getHitBox())) {
                continue;
            }
            const obstacleBox = obstacle.getHitBox();
            if (this.powers.dash > 0) {
                const pos = obstacle.node.position.clone();
                this.score += 180 * this.currentMultiplier();
                obstacle.node.active = false;
                obstacle.node.destroy();
                this.spawnFlyingCoins(pos, 2);
                this.feedback?.showText(this.t('\u51b2\u7834\u969c\u788d +180', 'Dash break +180'), pos.add(new Vec3(0, 60, 0)), new Color(113, 142, 236, 255), 24);
                continue;
            }
            if (obstacle.obstacleKind === 'turtle') {
                if (this.isStompingObstacle(playerBox, obstacleBox)) {
                    this.activateTurtleShell(obstacle);
                    continue;
                }
                this.offerRevive();
                return;
            }
            if (obstacle.passType === 'slide' && this.runner?.isSliding) {
                if (!obstacle.passed) {
                    obstacle.passed = true;
                    this.slideDodges += 1;
                    this.dodges += 1;
                    this.combo += 2;
                    this.recordCombo();
                    this.comboTimer = 2.2;
                    this.score += 80 * this.currentMultiplier();
                    this.feedback?.showText(this.t('\u4f4e\u5934\u901a\u8fc7 +80', 'Slide dodge +80'), obstacle.node.position.clone().add(new Vec3(0, -56, 0)), new Color(255, 152, 84, 255), 24);
                }
                continue;
            }
            if (this.powers.shield > 0) {
                this.powers.shield = 0;
                this.shieldBlocks += 1;
                obstacle.node.active = false;
                this.flashPlayer();
                this.feedback?.shake(this.worldRoot, 8);
                this.feedback?.showText(this.t('\u62a4\u76fe\u62b5\u6321', 'Shield block'), obstacle.node.position.clone().add(new Vec3(0, 60, 0)), new Color(74, 145, 226, 255), 26);
                continue;
            }
            this.offerRevive();
            return;
        }
    }

    private isStompingObstacle(playerBox: Rect, obstacleBox: Rect): boolean {
        const playerBottom = playerBox.y;
        const obstacleTop = obstacleBox.y + obstacleBox.height;
        return !!this.runner?.isAirborne && playerBottom >= obstacleTop - 24;
    }

    private activateTurtleShell(obstacle: Obstacle): void {
        if (!this.textures) {
            return;
        }
        const node = obstacle.node;
        const sprite = node.getComponent(Sprite);
        if (sprite) {
            sprite.spriteFrame = this.textures.turtleShell;
        }
        const width = 112;
        const height = 66;
        node.name = 'TurtleShell';
        node.getComponent(UITransform)?.setContentSize(width, height);
        node.setPosition(node.position.x, this.surfaceY + height * 0.5, 0);
        this.obstacles = this.obstacles.filter((item) => item !== obstacle);
        obstacle.destroy();
        this.turtleShells.push({ node, width, height, clears: 0 });
        this.turtleStomps += 1;
        this.runner?.bounce();
        this.combo += 3;
        this.recordCombo();
        this.comboTimer = 2.2;
        this.score += 160 * this.currentMultiplier();
        this.feedback?.showText(this.t('\u4e4c\u9f9f\u51b2\u523a\uff01', 'Turtle rush!'), node.position.clone().add(new Vec3(0, 58, 0)), new Color(87, 170, 84, 255), 24);
    }

    private updateTurtleShells(dt: number): void {
        if (!this.obstacleRoot) {
            return;
        }
        for (const shell of this.turtleShells) {
            if (!shell.node.isValid || !shell.node.active) {
                continue;
            }
            const pos = shell.node.position.clone();
            pos.x += this.turtleShellSpeed * dt;
            shell.node.setPosition(pos);
            const shellBox = this.getTurtleShellHitBox(shell);
            this.clearObstaclesWithTurtleShell(shell, shellBox);
            this.clearMissilesWithTurtleShell(shell, shellBox);
            if (pos.x > 820) {
                shell.node.destroy();
            }
        }
        this.turtleShells = this.turtleShells.filter((shell) => shell.node.isValid && shell.node.position.x <= 820);
        this.obstacles = this.obstacles.filter((obstacle) => obstacle.node.isValid && obstacle.node.active);
    }

    private clearObstaclesWithTurtleShell(shell: TurtleShell, shellBox: Rect): void {
        for (const obstacle of this.obstacles) {
            if (!obstacle.node.active || obstacle.passType !== 'jump' || obstacle.node === shell.node) {
                continue;
            }
            if (!shellBox.intersects(obstacle.getHitBox())) {
                continue;
            }
            const pos = obstacle.node.position.clone();
            obstacle.node.active = false;
            obstacle.node.destroy();
            shell.clears += 1;
            this.turtleClears += 1;
            this.bestTurtleShellClears = Math.max(this.bestTurtleShellClears, shell.clears);
            this.spawnFlyingCoins(pos, 3);
            this.score += 120 * this.currentMultiplier();
            this.feedback?.showText('+120', pos.add(new Vec3(0, 52, 0)), new Color(87, 170, 84, 255), 22);
        }
    }

    private spawnFlyingCoins(origin: Vec3, count: number): void {
        if (!this.textures || !this.itemRoot) {
            return;
        }
        const offsets = [-34, 0, 34];
        for (let i = 0; i < count; i++) {
            const x = origin.x + (offsets[i] ?? this.randomRange(-44, 44));
            const y = origin.y + 58 + this.randomRange(-8, 22);
            const node = this.makeSprite('FlyingCoin', this.itemRoot, this.textures.coinFlying, 58, 38, new Vec3(x, y, 0));
            const collectible = node.addComponent(Collectible);
            collectible.kind = 'coin';
            collectible.value = 1;
            collectible.coinTone = 'gold';
            collectible.isFlyingCoin = true;
            collectible.reset();
            this.collectibles.push(collectible);
            this.flyingCoins.push({
                node,
                baseY: y,
                phase: Math.random() * Math.PI * 2,
                amplitude: 14 + Math.random() * 10,
                speed: 4.2 + Math.random() * 1.8,
            });
        }
    }

    private updateFlyingCoins(dt: number): void {
        for (const coin of this.flyingCoins) {
            if (!coin.node.isValid || !coin.node.active) {
                continue;
            }
            coin.phase += coin.speed * dt;
            const pos = coin.node.position.clone();
            pos.y = coin.baseY + Math.sin(coin.phase) * coin.amplitude;
            coin.node.setPosition(pos);
            coin.node.angle = Math.sin(coin.phase * 1.35) * 8;
        }
        this.flyingCoins = this.flyingCoins.filter((coin) => coin.node.isValid && coin.node.active && coin.node.position.x > -780);
    }

    private updateFishProjectiles(dt: number): void {
        for (const dart of this.fishProjectiles) {
            if (!dart.node.isValid || !dart.node.active) {
                continue;
            }
            const pos = dart.node.position.clone();
            pos.x += 1180 * dt;
            dart.node.setPosition(pos);
            dart.node.angle = Math.sin(Date.now() * 0.02) * 3;
            const dartBox = this.getFishProjectileHitBox(dart);
            this.clearObstaclesWithFishDart(dartBox);
            this.clearMissilesWithFishDart(dartBox);
            if (pos.x > 840) {
                dart.node.destroy();
            }
        }
        this.fishProjectiles = this.fishProjectiles.filter((dart) => dart.node.isValid && dart.node.position.x <= 840);
        this.obstacles = this.obstacles.filter((obstacle) => obstacle.node.isValid && obstacle.node.active);
    }

    private clearObstaclesWithFishDart(dartBox: Rect): void {
        for (const obstacle of this.obstacles) {
            if (!obstacle.node.active || !dartBox.intersects(obstacle.getHitBox())) {
                continue;
            }
            const pos = obstacle.node.position.clone();
            obstacle.node.active = false;
            obstacle.node.destroy();
            this.spawnFlyingCoins(pos, 3);
            this.score += 140 * this.currentMultiplier();
            this.feedback?.showText('+140', pos.add(new Vec3(0, 54, 0)), new Color(255, 152, 84, 255), 22);
        }
    }

    private clearMissilesWithFishDart(dartBox: Rect): void {
        for (const missile of this.missiles) {
            if (missile.state !== 'flying' || missile.hit || !missile.missileNode?.active) {
                continue;
            }
            if (!dartBox.intersects(this.getMissileHitBox(missile))) {
                continue;
            }
            missile.hit = true;
            const pos = missile.missileNode.position.clone();
            missile.missileNode.active = false;
            missile.missileNode.destroy();
            missile.trailNode?.destroy();
            this.missileBlocks += 1;
            this.score += 180 * this.currentMultiplier();
            this.feedback?.showText(this.t('\u9c7c\u9aa8\u51fb\u843d +180', 'Dart hit +180'), pos.add(new Vec3(0, 48, 0)), new Color(255, 152, 84, 255), 22);
        }
    }

    private getFishProjectileHitBox(dart: FishProjectile): Rect {
        const pos = dart.node.worldPosition;
        return new Rect(pos.x - dart.width * 0.45, pos.y - dart.height * 0.32, dart.width * 0.9, dart.height * 0.64);
    }

    private clearMissilesWithTurtleShell(shell: TurtleShell, shellBox: Rect): void {
        for (const missile of this.missiles) {
            if (missile.state !== 'flying' || missile.hit || !missile.missileNode?.active) {
                continue;
            }
            if (!shellBox.intersects(this.getMissileHitBox(missile))) {
                continue;
            }
            missile.hit = true;
            const pos = missile.missileNode.position.clone();
            missile.missileNode.active = false;
            missile.missileNode.destroy();
            missile.trailNode?.destroy();
            this.missileBlocks += 1;
            shell.clears += 1;
            this.turtleClears += 1;
            this.bestTurtleShellClears = Math.max(this.bestTurtleShellClears, shell.clears);
            this.score += 180 * this.currentMultiplier();
            this.feedback?.showText(this.t('\u4e4c\u9f9f\u649e\u98de\u706b\u7bad +180', 'Rocket cleared +180'), pos.add(new Vec3(0, 48, 0)), new Color(87, 170, 84, 255), 22);
        }
    }

    private getTurtleShellHitBox(shell: TurtleShell): Rect {
        const pos = shell.node.worldPosition;
        return new Rect(pos.x - shell.width * 0.48, pos.y - shell.height * 0.38, shell.width * 0.96, shell.height * 0.76);
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
        if (this.saveData.settings.assistHints) {
            this.feedback?.showText(this.t('\u5bfc\u5f39\u9884\u8b66\uff01', 'Missile incoming!'), new Vec3(260, y + 28, 0), new Color(230, 92, 62, 255), 24);
        }
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
                if (!missile.hit) {
                    missile.hit = true;
                    this.missileDodges += 1;
                    this.dodges += 1;
                    this.score += 120 * this.currentMultiplier();
                    this.feedback?.showText(this.t('\u706b\u7bad\u64e6\u80a9 +120', 'Missile dodged +120'), new Vec3(this.playerX + 36, missile.y + 36, 0), new Color(255, 152, 84, 255), 22);
                }
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
                this.missileBlocks += 1;
                missile.missileNode.active = false;
                missile.trailNode?.destroy();
                this.feedback?.showText(this.t('\u51b2\u6563\u5bfc\u5f39 +220', 'Missile dashed +220'), missile.missileNode.position.clone().add(new Vec3(0, 48, 0)), new Color(113, 142, 236, 255), 24);
                continue;
            }
            if (this.powers.shield > 0) {
                this.powers.shield = 0;
                this.shieldBlocks += 1;
                this.missileBlocks += 1;
                missile.missileNode.active = false;
                missile.trailNode?.destroy();
                this.flashPlayer();
                this.feedback?.shake(this.worldRoot, 10);
                this.feedback?.showText(this.t('\u62a4\u76fe\u6321\u4e0b\u5bfc\u5f39', 'Shield stopped missile'), missile.missileNode.position.clone().add(new Vec3(0, 52, 0)), new Color(74, 145, 226, 255), 26);
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
        if (this.saveData.inventory.reviveTicket > 0 && !this.reviveUsed) {
            this.saveData.inventory.reviveTicket -= 1;
            this.saveData.reviveTicketsUsed += 1;
            this.reviveUsed = true;
            this.saveGame();
            this.checkAchievementsNow();
            this.feedback?.showText(this.t('\u590d\u6d3b\u5238\u751f\u6548\uff01', 'Revive ticket used!'), new Vec3(0, 24, 0), new Color(255, 152, 84, 255), 30);
            this.reviveFromTicket();
            return;
        }
        if (this.reviveUsed) {
            this.gameOver();
            return;
        }
        this.reviveUsed = true;
        this.state = 'revive';
        this.reviveAdTimer = 0;
        this.hud?.setRevive();
        this.feedback?.shake(this.worldRoot, 8);
        this.feedback?.showText(this.t('\u8981\u590d\u6d3b\u5417\uff1f', 'Revive?'), new Vec3(0, 24, 0), new Color(255, 152, 84, 255), 30);
    }

    private reviveFromTicket(): void {
        this.state = 'playing';
        this.clearDangerAroundPlayer();
        this.powers.shield = Math.max(this.powers.shield, 4.5);
        this.comboTimer = 1.4;
        this.hud?.setPlaying();
        this.flashPlayer();
        this.updatePowerEffects(0);
        this.audioManager?.playSfx('powerup');
    }

    private reviveFromAd(): void {
        if (this.state !== 'revive') {
            return;
        }
        this.reviveAdTimer = 0;
        this.hud?.setReviveAdProgress(false);
        this.clearDangerAroundPlayer();
        this.powers.shield = Math.max(this.powers.shield, 3.5);
        this.comboTimer = 1.4;
        this.state = 'playing';
        this.hud?.setPlaying();
        this.flashPlayer();
        this.updatePowerEffects(0);
        this.feedback?.showText(this.t('\u590d\u6d3b\u6210\u529f\uff01', 'Revived!'), new Vec3(this.playerX + 70, this.playerGroundY + 120, 0), new Color(74, 145, 226, 255), 28);
        this.audioManager?.playSfx('powerup');
    }

    private startReviveAdCountdown(): void {
        if (this.state !== 'revive' || this.reviveAdTimer > 0) {
            return;
        }
        this.reviveAdTimer = this.reviveAdDuration;
        this.hud?.setReviveAdProgress(true, this.reviveAdTimer);
        this.feedback?.showText(this.t('\u5e7f\u544a\u64ad\u653e\u4e2d...', 'Ad playing...'), new Vec3(0, 24, 0), new Color(255, 152, 84, 255), 28);
        this.audioManager?.playSfx('coin');
    }

    private updateReviveAd(dt: number): void {
        if (this.reviveAdTimer <= 0) {
            return;
        }
        this.reviveAdTimer = Math.max(0, this.reviveAdTimer - dt);
        this.hud?.setReviveAdProgress(true, this.reviveAdTimer);
        if (this.reviveAdTimer <= 0) {
            this.reviveFromAd();
        }
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
        if (!this.isTimedPowerKind(kind)) {
            return;
        }
        this.activateTimedPower(kind);
    }

    private activateTimedPower(kind: PowerKind): void {
        const duration = this.powerDuration(kind);
        this.powers[kind] = Math.max(this.powers[kind], duration);
        if (kind === 'dash') {
            this.beginInvincibleDash();
        }
        this.flashPlayer();
        if (this.textures) {
            this.runner?.playSpecial(this.currentSkinFrames().power[kind], 0.38);
        }
        this.feedback?.showPulse(this.frameForCollectible(kind), new Vec3(this.playerX, this.playerGroundY + 72, 0), this.powerColor(kind), 120);
    }

    private isTimedPowerKind(kind: CollectibleKind): kind is PowerKind {
        return kind === 'magnet' || kind === 'shield' || kind === 'score' || kind === 'dash';
    }

    private setHeldActiveItem(kind: ActiveItemKind | null): void {
        this.heldActiveItem = kind;
        this.hud?.setActiveItem(kind ? this.frameForCollectible(kind) : null);
    }

    private useHeldActiveItem(): void {
        if (this.state !== 'playing' || !this.heldActiveItem) {
            return;
        }
        const item = this.heldActiveItem;
        this.setHeldActiveItem(null);
        if (item === 'fishDart') {
            this.fireFishDart();
            return;
        }
        this.openMysteryBox();
    }

    private fireFishDart(): void {
        if (!this.textures || !this.itemRoot || !this.player) {
            return;
        }
        const y = this.player.position.y + 16;
        const node = this.makeSprite('FishDartProjectile', this.itemRoot, this.textures.fishProjectile, 152, 70, new Vec3(this.playerX + 72, y, 0));
        this.fishProjectiles.push({ node, width: 152, height: 70 });
        this.feedback?.showText(this.t('\u9c7c\u9aa8\u98de\u9556\uff01', 'Fish dart!'), new Vec3(this.playerX + 96, y + 48, 0), new Color(255, 152, 84, 255), 24);
    }

    private openMysteryBox(): void {
        const roll = Math.random();
        const kind: PowerKind = roll < 0.34 ? 'dash' : roll < 0.67 ? 'magnet' : 'shield';
        this.activateTimedPower(kind);
        this.audioManager?.playSfx('powerup');
        this.feedback?.showText(`${this.t('\u5b9d\u7bb1', 'Box')}: ${this.powerName(kind)}!`, new Vec3(this.playerX + 86, this.playerGroundY + 118, 0), new Color(255, 152, 84, 255), 26);
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
        this.checkMissionToasts();
    }

    private checkMissionToasts(): void {
        if (this.state !== 'playing') {
            return;
        }
        for (const mission of MISSION_DEFS) {
            if (this.missionToastShown[mission.id] || this.missionCurrent(mission.id) < mission.target) {
                continue;
            }
            this.missionToastShown[mission.id] = true;
            this.hud?.showMissionToast(this.missionLabel(mission.id), mission.reward);
        }
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

    private frameForCollectible(kind: CollectibleKind, tone: CoinTone = 'gold'): SpriteFrame {
        if (!this.textures) {
            throw new Error('Textures are not loaded');
        }
        if (kind === 'coin' && tone === 'silver') return this.textures.coinSilver;
        if (kind === 'coin' && tone === 'bronze') return this.textures.coinBronze;
        if (kind === 'magnet') return this.textures.magnet;
        if (kind === 'shield') return this.textures.shield;
        if (kind === 'score') return this.textures.scoreStar;
        if (kind === 'dash') return this.textures.dash;
        if (kind === 'fishDart') return this.textures.fishDart;
        if (kind === 'mysteryBox') return this.textures.mysteryBox;
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
        input.on(Input.EventType.TOUCH_MOVE, this.onPressMove, this);
        input.on(Input.EventType.TOUCH_END, this.onPressEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onPressEnd, this);
        input.on(Input.EventType.MOUSE_DOWN, this.onPressStart, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onPressMove, this);
        input.on(Input.EventType.MOUSE_UP, this.onPressEnd, this);
    }

    private onKeyDown(event: EventKeyboard): void {
        if (event.keyCode === KeyCode.SPACE || event.keyCode === KeyCode.KEY_W || event.keyCode === KeyCode.ARROW_UP) {
            const wasJumpHeld = this.spaceHeld;
            this.spaceHeld = true;
            if (this.state === 'playing' && !wasJumpHeld) {
                if (this.runner?.isAirborne) {
                    if (this.runner.canDoubleJump()) {
                        this.jumpIntentTimer = -1;
                        this.runner.jump();
                    } else {
                        this.jumpIntentTimer = this.jumpIntentDelay;
                    }
                } else {
                    this.jumpIntentTimer = -1;
                    this.runner?.jump();
                }
            }
        }
        if (event.keyCode === KeyCode.ARROW_LEFT || event.keyCode === KeyCode.KEY_A) {
            this.casualInputX = -1;
        }
        if (event.keyCode === KeyCode.ARROW_RIGHT || event.keyCode === KeyCode.KEY_D) {
            this.casualInputX = 1;
        }
        if (event.keyCode === KeyCode.ARROW_DOWN || event.keyCode === KeyCode.KEY_S) {
            if (this.state === 'playing') {
                this.runner?.slide(true);
            }
        }
        if (event.keyCode === KeyCode.KEY_P) {
            if (this.state === 'playing' || this.state === 'casual') {
                this.pauseRun();
            } else if (this.state === 'pause') {
                this.resumeRun();
            }
        }
        if (event.keyCode === KeyCode.KEY_E) {
            this.useHeldActiveItem();
        }
        if (event.keyCode === KeyCode.ENTER && this.state !== 'playing' && this.state !== 'casual' && this.state !== 'pause') {
            this.startRun();
        }
        if (event.keyCode === KeyCode.ESCAPE) {
            if (this.state === 'settings' || this.state === 'upgrade' || this.state === 'achievements') {
                this.showMenu();
            } else if (this.state === 'pause') {
                this.resumeRun();
            }
        }
    }

    private onKeyUp(event: EventKeyboard): void {
        if (event.keyCode === KeyCode.SPACE || event.keyCode === KeyCode.KEY_W || event.keyCode === KeyCode.ARROW_UP) {
            this.spaceHeld = false;
            if (this.state === 'playing' && this.jumpIntentTimer >= 0) {
                this.jumpIntentTimer = -1;
                if (this.runner?.isAirborne && this.runner.canDoubleJump()) {
                    this.runner.jump();
                    return;
                }
            }
            this.runner?.stopGlide();
        }
        if ((event.keyCode === KeyCode.ARROW_LEFT || event.keyCode === KeyCode.KEY_A) && this.casualInputX < 0) {
            this.casualInputX = 0;
        }
        if ((event.keyCode === KeyCode.ARROW_RIGHT || event.keyCode === KeyCode.KEY_D) && this.casualInputX > 0) {
            this.casualInputX = 0;
        }
        if (event.keyCode === KeyCode.ARROW_DOWN || event.keyCode === KeyCode.KEY_S) {
            this.runner?.stopSlide();
        }
    }

    private onPressStart(event?: { getLocationX?: () => number }): void {
        const wasTouchHeld = this.touchHeld;
        this.touchHeld = true;
        if (this.state === 'casual') {
            this.casualPointerActive = true;
            this.casualPointerStartX = event?.getLocationX?.() ?? 0;
            this.casualInputX = 0;
            return;
        }
        if (this.state === 'playing' && !wasTouchHeld) {
            if (this.runner?.isAirborne) {
                if (this.runner.canDoubleJump()) {
                    this.touchJumpIntentTimer = -1;
                    this.runner.jump();
                } else {
                    this.touchJumpIntentTimer = this.jumpIntentDelay;
                }
            } else {
                this.touchJumpIntentTimer = -1;
                this.runner?.jump();
            }
        }
    }

    private onPressMove(event?: { getLocationX?: () => number }): void {
        if (this.state !== 'casual' || !this.casualPointerActive) {
            return;
        }
        const currentX = event?.getLocationX?.() ?? this.casualPointerStartX;
        const deltaX = currentX - this.casualPointerStartX;
        if (Math.abs(deltaX) < this.casualDragDeadZone) {
            this.casualInputX = 0;
            return;
        }
        this.casualInputX = deltaX > 0 ? 1 : -1;
    }

    private onPressEnd(): void {
        if (this.state === 'casual' || this.casualPointerActive) {
            this.casualPointerActive = false;
            this.casualInputX = 0;
        }
        this.touchHeld = false;
        if (this.state === 'playing' && this.touchJumpIntentTimer >= 0) {
            this.touchJumpIntentTimer = -1;
            if (this.runner?.isAirborne && this.runner.canDoubleJump()) {
                this.runner.jump();
                return;
            }
        }
        this.runner?.stopGlide();
    }

    private onStartPressed(): void { this.startRun(); }
    private onCasualPressed(): void { this.startCasualMode(); }
    private onRetryPressed(): void {
        if (this.lastRunMode === 'casual') {
            this.startCasualMode();
            return;
        }
        this.startRun();
    }
    private onSettingsPressed(): void { this.showSettings(); }
    private onUpgradePressed(): void { this.showUpgrade(); }
    private onAchievementsPressed(): void { this.showAchievements(); }
    private onShopTabPressed(tab: ShopTab): void {
        this.shopTab = tab;
        this.showUpgrade();
    }
    private onLeaderboardPressed(): void {
        const currentEntry = this.state === 'gameover' ? this.latestLeaderboardEntry : null;
        this.hud?.setLeaderboard(this.leaderboardView(10, currentEntry));
    }
    private onLeaderboardBackPressed(): void { this.hud?.closeLeaderboard(); }
    private onReviveAdPressed(): void { this.startReviveAdCountdown(); }
    private onReviveGiveUpPressed(): void {
        this.reviveAdTimer = 0;
        this.hud?.setReviveAdProgress(false);
        this.gameOver();
    }
    private onPausePressed(): void { this.pauseRun(); }
    private onActiveItemPressed(): void { this.useHeldActiveItem(); }
    private onContinuePressed(): void { this.resumeRun(); }
    private onMenuPressed(): void { this.showMenu(); }
    private onBackPressed(): void { this.showMenu(); }
    private onSettingsLanguagePressed(): void {
        this.saveData.settings.language = this.saveData.settings.language === 'zh' ? 'en' : 'zh';
        this.saveGame();
        this.applySettings();
        this.feedback?.showText(this.t('\u8bed\u8a00\u5df2\u5207\u6362', 'Language switched'), new Vec3(0, -132, 0), new Color(106, 166, 214, 255), 24);
    }

    private onSettingsAssistPressed(): void {
        this.saveData.settings.assistHints = !this.saveData.settings.assistHints;
        this.saveGame();
        this.hud?.updateSettings(this.settingsView());
        this.feedback?.showText(this.saveData.settings.assistHints ? this.t('\u8f85\u52a9\u63d0\u793a\u5df2\u5f00\u542f', 'Assist hints on') : this.t('\u8f85\u52a9\u63d0\u793a\u5df2\u5173\u95ed', 'Assist hints off'), new Vec3(0, -132, 0), new Color(106, 166, 214, 255), 24);
    }

    private onSettingsResetSavePressed(): void {
        const settings = { ...this.saveData.settings };
        this.saveData = {
            ...DEFAULT_SAVE,
            upgrades: { ...DEFAULT_UPGRADES },
            inventory: { ...DEFAULT_INVENTORY },
            unlockedSkins: ['classic'],
            leaderboard: [],
            achievements: {},
            settings,
        };
        this.latestLeaderboardEntry = null;
        this.applySelectedSkin();
        this.saveGame();
        this.hud?.updateSettings(this.settingsView());
        this.hud?.setMenu(this.saveView(), this.skinViews());
        this.showSettings();
        this.feedback?.showText(this.t('\u5b58\u6863\u5df2\u91cd\u7f6e', 'Save reset'), new Vec3(0, -132, 0), new Color(219, 102, 64, 255), 24);
    }

    private onSettingsResetRankPressed(): void {
        this.saveData.leaderboard = [];
        this.latestLeaderboardEntry = null;
        this.saveGame();
        this.hud?.updateSettings(this.settingsView());
        this.feedback?.showText(this.t('\u6392\u884c\u699c\u5df2\u6e05\u7a7a', 'Ranking cleared'), new Vec3(0, -132, 0), new Color(219, 102, 64, 255), 24);
    }

    private adjustBgmVolume(delta: number): void {
        this.setBgmVolume(this.saveData.settings.bgmVolume + delta);
    }

    private adjustSfxVolume(delta: number): void {
        this.setSfxVolume(this.saveData.settings.sfxVolume + delta);
        this.audioManager?.playSfx('coin');
    }

    private applySettings(): void {
        this.audioManager?.setBgmVolume(this.saveData.settings.bgmVolume);
        this.audioManager?.setSfxVolume(this.saveData.settings.sfxVolume);
        this.hud?.updateSettings(this.settingsView());
    }

    private settingsView(): SettingsView {
        return {
            language: this.saveData.settings.language,
            bgmVolume: this.saveData.settings.bgmVolume,
            sfxVolume: this.saveData.settings.sfxVolume,
            assistHints: this.saveData.settings.assistHints,
        };
    }

    private t(zh: string, en: string): string {
        return this.saveData.settings.language === 'zh' ? zh : en;
    }

    private clamp01(value: unknown): number {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
            return 0;
        }
        return Math.max(0, Math.min(1, numeric));
    }

    private applyStartConsumables(): void {
        let consumed = false;
        if (this.saveData.inventory.startDash > 0) {
            this.saveData.inventory.startDash -= 1;
            const dashDuration = 6.6;
            this.powers.dash = Math.max(this.powers.dash, dashDuration);
            this.powers.magnet = Math.max(this.powers.magnet, dashDuration);
            this.beginInvincibleDash();
            this.feedback?.showText(this.t('\u5f00\u5c40\u51b2\u523a 200m\uff01', 'Start dash 200m!'), new Vec3(0, 72, 0), new Color(113, 142, 236, 255), 26);
            consumed = true;
        }
        if (this.saveData.inventory.startShield > 0) {
            this.saveData.inventory.startShield -= 1;
            this.powers.shield = Math.max(this.powers.shield, 5.8);
            this.feedback?.showText(this.t('\u5f00\u5c40\u62a4\u76fe\u5df2\u751f\u6548', 'Start shield active'), new Vec3(0, 110, 0), new Color(74, 145, 226, 255), 24);
            consumed = true;
        }
        if (consumed) {
            this.saveGame();
            this.updatePowerEffects(0);
        }
    }

    private buyUpgrade(kind: PowerKind): void {
        if (this.state !== 'upgrade') {
            return;
        }
        const level = this.saveData.upgrades[kind];
        if (level >= MAX_UPGRADE_LEVEL) {
            this.feedback?.showText(this.t('\u5df2\u6ee1\u7ea7', 'Max level'), new Vec3(0, -120, 0), new Color(106, 166, 214, 255), 28);
            return;
        }
        const cost = this.upgradeCost(kind);
        if (this.saveData.totalCoins < cost) {
            this.feedback?.showText(this.t('\u91d1\u5e01\u4e0d\u8db3', 'Not enough coins'), new Vec3(0, -120, 0), new Color(219, 102, 64, 255), 28);
            return;
        }
        this.saveData.totalCoins -= cost;
        this.saveData.upgrades[kind] += 1;
        this.saveGame();
        this.feedback?.showText(`${this.powerName(kind)} Lv.${this.saveData.upgrades[kind]}`, new Vec3(0, -120, 0), new Color(255, 152, 84, 255), 28);
        this.hud?.setUpgrade(this.saveView(), this.skinViews(), this.upgradeCosts(), this.consumableViews(), this.shopTab);
    }

    private buyConsumable(kind: ConsumableKind): void {
        if (this.state !== 'upgrade') {
            return;
        }
        const cost = CONSUMABLE_COSTS[kind];
        if (this.saveData.totalCoins < cost) {
            this.feedback?.showText(this.t('\u91d1\u5e01\u4e0d\u8db3', 'Not enough coins'), new Vec3(0, -120, 0), new Color(219, 102, 64, 255), 28);
            return;
        }
        this.saveData.totalCoins -= cost;
        this.saveData.inventory[kind] += 1;
        this.saveData.consumablesBought += 1;
        this.saveGame();
        this.checkAchievementsNow(this.saveData.totalCoins);
        this.feedback?.showText(`${this.consumableLabel(kind)} +1`, new Vec3(0, -120, 0), new Color(255, 152, 84, 255), 28);
        this.hud?.setUpgrade(this.saveView(), this.skinViews(), this.upgradeCosts(), this.consumableViews(), this.shopTab);
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
                this.feedback?.showText(this.t('\u91d1\u5e01\u4e0d\u8db3', 'Not enough coins'), new Vec3(0, -120, 0), new Color(219, 102, 64, 255), 28);
                return;
            }
            this.saveData.totalCoins -= skin.cost;
            this.saveData.unlockedSkins.push(id);
        }
        this.saveData.selectedSkin = id;
        this.applySelectedSkin();
        this.saveGame();
        this.feedback?.showText(this.t('\u76ae\u80a4\u5df2\u5207\u6362', 'Skin changed'), new Vec3(0, -120, 0), new Color(255, 152, 84, 255), 28);
        this.hud?.setUpgrade(this.saveView(), this.skinViews(), this.upgradeCosts(), this.consumableViews(), this.shopTab);
    }

    private applySelectedSkin(): void {
        const sprite = this.player?.getComponent(Sprite);
        const frames = this.currentSkinFrames();
        if (sprite && this.runner) {
            sprite.color = new Color(255, 255, 255, 255);
            this.runner.setupAnimation(
                sprite,
                frames.run,
                frames.jump,
                frames.slide,
                frames.fall,
                frames.glide,
                this.audioManager,
            );
        } else if (sprite) {
            sprite.spriteFrame = frames.preview;
            sprite.color = new Color(255, 255, 255, 255);
        }
    }

    private currentSkinFrames(): RunnerSkinFrames {
        const textures = this.textures;
        if (!textures) {
            throw new Error('Textures not loaded');
        }
        return textures.runnerSkins[this.saveData.selectedSkin] ?? textures.runnerSkins.classic;
    }

    private powerDuration(kind: PowerKind): number {
        const level = this.saveData.upgrades[kind];
        if (kind === 'magnet') return 4.8 + level * 0.85;
        if (kind === 'shield') return 4.6 + level * 0.8;
        if (kind === 'score') return 4.8 + level * 0.72;
        return 1.9 + level * 0.28;
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
            return this.t('\u91d1\u5e01', 'Coin');
        }
        if (this.isActiveItemKind(kind)) {
            return this.activeItemName(kind);
        }
        return this.saveData.settings.language === 'zh' ? POWER_NAMES[kind] : POWER_NAMES_EN[kind];
    }

    private activeItemName(kind: ActiveItemKind): string {
        if (kind === 'fishDart') {
            return this.t('\u9c7c\u9aa8\u98de\u9556', 'Fish Dart');
        }
        return this.t('\u9053\u5177\u5b9d\u7bb1', 'Mystery Box');
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
            totalStars: this.saveData.totalStars,
            bestScore: this.saveData.bestScore,
            bestScoreToday: this.todayBestScore(),
            selectedSkin: this.saveData.selectedSkin,
            upgrades: { ...this.saveData.upgrades },
            inventory: { ...this.saveData.inventory },
        };
    }

    private consumableViews(): ConsumableShopView[] {
        return (Object.keys(DEFAULT_INVENTORY) as ConsumableKind[]).map((id) => ({
            id,
            label: this.consumableLabel(id),
            description: this.consumableDescription(id),
            cost: CONSUMABLE_COSTS[id],
            count: this.saveData.inventory[id],
        }));
    }

    private consumableLabel(id: ConsumableKind): string {
        if (id === 'startDash') return this.t('\u5f00\u5c40\u51b2\u523a', 'Start Dash');
        if (id === 'reviveTicket') return this.t('\u590d\u6d3b\u5238', 'Revive Ticket');
        return this.t('\u5f00\u5c40\u62a4\u76fe', 'Start Shield');
    }

    private consumableDescription(id: ConsumableKind): string {
        if (id === 'startDash') return this.t('\u77ed\u7a0b\u51b2\u523a+\u78c1\u94c1', 'Short dash + magnet');
        if (id === 'reviveTicket') return this.t('\u5c40\u5185\u81ea\u52a8\u590d\u6d3b', 'Auto revive');
        return this.t('\u5f00\u5c40\u62a4\u4f53', 'Shield at start');
    }

    private skinViews(): SkinView[] {
        return SKINS.map((skin) => ({
            id: skin.id,
            label: this.skinLabel(skin.id, false),
            shortLabel: this.skinLabel(skin.id, true),
            selected: this.saveData.selectedSkin === skin.id,
            unlocked: this.saveData.unlockedSkins.indexOf(skin.id) >= 0,
            cost: skin.cost,
            preview: this.textures.runnerSkins[skin.id].preview,
        }));
    }

    private skinLabel(id: SkinId, short: boolean): string {
        if (this.saveData.settings.language === 'zh') {
            const skin = SKINS.find((item) => item.id === id);
            return short ? skin?.shortLabel ?? id : skin?.label ?? id;
        }
        if (id === 'berry') return short ? 'Berry' : 'Berry Hakimi';
        if (id === 'mint') return short ? 'Mint' : 'Mint Pilot Hakimi';
        return short ? 'Classic' : 'Classic Hakimi';
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
                label: this.missionLabel(mission.id),
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

    private achievementViews(): AchievementEntryView[] {
        return ACHIEVEMENT_DEFS.map((achievement) => ({
            id: achievement.id,
            label: this.achievementLabel(achievement.id),
            description: this.achievementDescription(achievement.id),
            stars: achievement.reward,
            completed: this.saveData.achievements[achievement.id] === true,
        }));
    }

    private unlockedAchievements(finalScore: number, projectedCoins: number): Array<AchievementView & { id: AchievementId }> {
        const unlocked: Array<AchievementView & { id: AchievementId }> = [];
        for (const achievement of ACHIEVEMENT_DEFS) {
            if (this.saveData.achievements[achievement.id] || !this.isAchievementDone(achievement.id, finalScore, projectedCoins)) {
                continue;
            }
            unlocked.push({ id: achievement.id, label: this.achievementLabel(achievement.id), reward: achievement.reward });
        }
        return unlocked;
    }

    private checkAchievementsNow(projectedCoins = this.saveData.totalCoins + this.runCoins, includeRunEndAchievements = false): void {
        const score = Math.floor(this.score);
        for (const achievement of ACHIEVEMENT_DEFS) {
            if (!includeRunEndAchievements && achievement.id === 'firstRun') {
                continue;
            }
            if (this.saveData.achievements[achievement.id] || !this.isAchievementDone(achievement.id, score, projectedCoins)) {
                continue;
            }
            this.unlockAchievement(achievement.id);
        }
    }

    private unlockAchievement(id: AchievementId): void {
        if (this.saveData.achievements[id]) {
            return;
        }
        const definition = ACHIEVEMENT_DEFS.find((achievement) => achievement.id === id);
        if (!definition) {
            return;
        }
        const view: AchievementView = {
            id,
            label: this.achievementLabel(id),
            reward: definition.reward,
            icon: this.textures?.achievementIcons[ACHIEVEMENT_DEFS.findIndex((achievement) => achievement.id === id)],
        };
        this.saveData.achievements[id] = true;
        this.saveData.totalStars += definition.reward;
        this.hud?.showAchievementNotice(view);
        this.saveGame();
    }

    private missionLabel(id: MissionId): string {
        if (id === 'coins') return this.t('\u91d1\u5e01', 'Coins');
        if (id === 'distance') return this.t('\u91cc\u7a0b', 'Distance');
        return this.t('\u8d8a\u8fc7', 'Dodges');
    }

    private achievementLabel(id: AchievementId): string {
        if (id === 'firstRun') return this.t('\u521d\u6b21\u51fa\u53d1', 'First Run');
        if (id === 'first1k') return this.t('\u9996\u6b21 1000m', 'First 1000m');
        if (id === 'first3k') return this.t('\u8fdc\u884c\u732b\u732b', 'Long Trip');
        if (id === 'coinCollector') return this.t('\u7d2f\u8ba1 500 \u91d1\u5e01', 'Collect 500 coins');
        if (id === 'coinTycoon') return this.t('\u91d1\u5e01\u5c0f\u5bcc\u8c6a', 'Coin Tycoon');
        if (id === 'combo20') return this.t('\u5355\u5c40 20 \u8fde\u51fb', '20 combo in one run');
        if (id === 'combo50') return this.t('\u5355\u5c40 50 \u8fde\u51fb', '50 combo in one run');
        if (id === 'shieldGuard') return this.t('\u62a4\u76fe\u62b5\u6321 3 \u6b21', 'Block 3 hits with shield');
        if (id === 'missileGuard') return this.t('\u5bfc\u5f39\u514b\u661f', 'Missile Guard');
        if (id === 'skinCollector') return this.t('\u8863\u6a71\u6536\u85cf', 'Skin Collector');
        if (id === 'upgradeNovice') return this.t('\u9053\u5177\u65b0\u624b', 'Upgrade Novice');
        if (id === 'upgradeMaster') return this.t('\u9053\u5177\u5927\u5e08', 'Upgrade Master');
        if (id === 'missionRunner') return this.t('\u4efb\u52a1\u8fbe\u4eba', 'Mission Runner');
        if (id === 'highObstacleFirst') return this.t('\u4f4e\u5934\u901a\u8fc7', 'Duck Under');
        if (id === 'highObstacleMaster') return this.t('\u8d34\u5730\u6ed1\u884c\u5bb6', 'Low Glide Pro');
        if (id === 'missileFirstDodge') return this.t('\u706b\u7bad\u64e6\u80a9', 'Rocket Brush');
        if (id === 'missileHunter') return this.t('\u706b\u7bad\u730e\u624b', 'Rocket Hunter');
        if (id === 'turtleStomp') return this.t('\u8e29\u9f9f\u542f\u52a8', 'Turtle Starter');
        if (id === 'turtleSweeper') return this.t('\u9f9f\u58f3\u6e05\u9053\u592b', 'Shell Sweeper');
        if (id === 'turtleRampage') return this.t('\u6a2a\u626b\u4e00\u8def', 'Shell Rampage');
        if (id === 'flyingCoinCatch') return this.t('\u98de\u884c\u91d1\u5e01', 'Flying Coin');
        if (id === 'wingedTreasure') return this.t('\u7a7a\u4e2d\u5b9d\u85cf', 'Winged Treasure');
        if (id === 'casualFirstCloud') return this.t('\u7a7f\u4e91\u800c\u4e0a', 'Through the Cloud');
        if (id === 'casualBreakCloud') return this.t('\u8e0f\u788e\u4e91\u6735', 'Cloud Breaker');
        if (id === 'casualBreakMaster') return this.t('\u4e91\u5c42\u7834\u574f\u8005', 'Cloud Crusher');
        if (id === 'casualClimber') return this.t('\u4e91\u7aef\u6563\u6b65', 'Cloud Walker');
        if (id === 'casualSkyHigh') return this.t('\u5c0f\u5c0f\u767b\u5929\u8005', 'Tiny Sky Climber');
        if (id === 'casualNoFall30') return this.t('\u7a33\u7a33\u4e0a\u5347', 'Steady Climb');
        if (id === 'casualBounceChain') return this.t('\u5f39\u8df3\u8fde\u9501', 'Bounce Chain');
        if (id === 'reviveTicketUsed') return this.t('\u518d\u6765\u4e00\u6b21', 'One More Try');
        if (id === 'shopCustomer') return this.t('\u5c0f\u5e97\u987e\u5ba2', 'Shop Customer');
        if (id === 'powerSnack') return this.t('\u80fd\u91cf\u8865\u7ed9', 'Power Snack');
        if (id === 'coinVariety') return this.t('\u91d1\u94f6\u94dc\u95ea\u95ea', 'Coin Variety');
        return this.t('\u6ed1\u7fd4\u9ad8\u624b', 'Glide Master');
    }

    private achievementDescription(id: AchievementId): string {
        const def = ACHIEVEMENT_DEFS.find((item) => item.id === id);
        if (this.saveData.settings.language === 'zh') {
            return def?.description ?? '';
        }
        if (id === 'firstRun') return 'Finish any run';
        if (id === 'first1k') return 'Reach 1000m in one run';
        if (id === 'first3k') return 'Reach 3000m in one run';
        if (id === 'coinCollector') return 'Hold 500 coins';
        if (id === 'coinTycoon') return 'Hold 1500 coins';
        if (id === 'combo20') return 'Reach 20 combo';
        if (id === 'combo50') return 'Reach 50 combo';
        if (id === 'shieldGuard') return 'Block 3 hits in one run';
        if (id === 'missileGuard') return 'Block or dash through a missile';
        if (id === 'skinCollector') return 'Unlock 3 skins';
        if (id === 'upgradeNovice') return 'Upgrade any power to Lv.3';
        if (id === 'upgradeMaster') return 'Upgrade all powers to Lv.5';
        if (id === 'missionRunner') return 'Complete 10 missions';
        if (id === 'highObstacleFirst') return 'Slide under 1 high obstacle in one run';
        if (id === 'highObstacleMaster') return 'Slide under 8 high obstacles in one run';
        if (id === 'missileFirstDodge') return 'Dodge or clear your first missile';
        if (id === 'missileHunter') return 'Clear or block 5 missiles in one run';
        if (id === 'turtleStomp') return 'Stomp a turtle and launch its shell';
        if (id === 'turtleSweeper') return 'Clear 3 targets with one turtle shell';
        if (id === 'turtleRampage') return 'Clear 10 targets with turtles in one run';
        if (id === 'flyingCoinCatch') return 'Collect a flying coin';
        if (id === 'wingedTreasure') return 'Collect 15 flying coins in one run';
        if (id === 'casualFirstCloud') return 'Trigger a cloud jump in casual mode';
        if (id === 'casualBreakCloud') return 'Trigger 1 breakable cloud in casual mode';
        if (id === 'casualBreakMaster') return 'Trigger 8 breakable clouds in one run';
        if (id === 'casualClimber') return 'Reach 30 steps in casual mode';
        if (id === 'casualSkyHigh') return 'Reach 80 steps in casual mode';
        if (id === 'casualNoFall30') return 'Trigger 30 cloud jumps before falling';
        if (id === 'casualBounceChain') return 'Chain 5 cloud jumps in casual mode';
        if (id === 'reviveTicketUsed') return 'Use 1 revive ticket';
        if (id === 'shopCustomer') return 'Buy 5 consumable items';
        if (id === 'powerSnack') return 'Collect 5 powerups in one run';
        if (id === 'coinVariety') return 'Collect gold, silver, and bronze coins in one run';
        return 'Reach 1800m in one run';
    }

    private isAchievementDone(id: AchievementId, finalScore: number, projectedCoins: number): boolean {
        if (id === 'firstRun') return finalScore > 0;
        if (id === 'first1k') return this.distance >= 1000;
        if (id === 'first3k') return this.distance >= 3000;
        if (id === 'coinCollector') return projectedCoins >= 500;
        if (id === 'coinTycoon') return projectedCoins >= 1500;
        if (id === 'combo20') return this.maxCombo >= 20 || finalScore >= 5000;
        if (id === 'combo50') return this.maxCombo >= 50 || finalScore >= 16000;
        if (id === 'shieldGuard') return this.shieldBlocks >= 3;
        if (id === 'missileGuard') return this.missileBlocks > 0;
        if (id === 'skinCollector') return this.saveData.unlockedSkins.length >= 3;
        if (id === 'upgradeNovice') return POWER_KINDS.some((kind) => this.saveData.upgrades[kind] >= 3);
        if (id === 'upgradeMaster') return POWER_KINDS.every((kind) => this.saveData.upgrades[kind] >= MAX_UPGRADE_LEVEL);
        if (id === 'missionRunner') return this.saveData.missionsCompleted >= 10;
        if (id === 'highObstacleFirst') return this.slideDodges >= 1;
        if (id === 'highObstacleMaster') return this.slideDodges >= 8;
        if (id === 'missileFirstDodge') return this.missileBlocks + this.missileDodges > 0;
        if (id === 'missileHunter') return this.missileBlocks >= 5;
        if (id === 'turtleStomp') return this.turtleStomps >= 1;
        if (id === 'turtleSweeper') return this.bestTurtleShellClears >= 3;
        if (id === 'turtleRampage') return this.turtleClears >= 10;
        if (id === 'flyingCoinCatch') return this.flyingCoinsCollected >= 1;
        if (id === 'wingedTreasure') return this.flyingCoinsCollected >= 15;
        if (id === 'casualFirstCloud') return this.casualCloudTriggers >= 1;
        if (id === 'casualBreakCloud') return this.casualBreakClouds >= 1;
        if (id === 'casualBreakMaster') return this.casualBreakClouds >= 8;
        if (id === 'casualClimber') return this.casualHighestStep >= 30;
        if (id === 'casualSkyHigh') return this.casualHighestStep >= 80;
        if (id === 'casualNoFall30') return this.casualCloudTriggers >= 30;
        if (id === 'casualBounceChain') return this.casualBestJumpChain >= 5;
        if (id === 'reviveTicketUsed') return this.saveData.reviveTicketsUsed >= 1;
        if (id === 'shopCustomer') return this.saveData.consumablesBought >= 5;
        if (id === 'powerSnack') return this.powerupsCollected >= 5;
        if (id === 'coinVariety') return this.goldCoinsCollected > 0 && this.silverCoinsCollected > 0 && this.bronzeCoinsCollected > 0;
        return this.distance >= 1800;
    }

    private recordLeaderboard(score: number): number {
        const entry: LeaderboardEntry = {
            score,
            distance: Math.floor(this.distance),
            coins: this.runCoins,
            date: new Date().toISOString(),
        };
        this.latestLeaderboardEntry = entry;
        const ranked = [...this.saveData.leaderboard, entry]
            .sort((a, b) => b.score - a.score || b.distance - a.distance || b.coins - a.coins);
        const index = ranked.indexOf(entry);
        this.saveData.leaderboard = ranked.slice(0, 10);
        return index >= 0 ? index + 1 : ranked.length;
    }

    private leaderboardView(limit = 10, currentEntry: LeaderboardEntry | null = null): LeaderboardEntryView[] {
        return this.saveData.leaderboard.slice(0, limit).map((entry, index) => ({
            rank: index + 1,
            score: entry.score,
            distance: entry.distance,
            coins: entry.coins,
            isCurrent: entry === currentEntry,
        }));
    }

    private updateBestScores(score: number): void {
        if (score > this.saveData.bestScore) {
            this.saveData.bestScore = score;
        }
        const today = this.todayKey();
        if (this.saveData.bestScoreDate !== today) {
            this.saveData.bestScoreDate = today;
            this.saveData.bestScoreToday = 0;
        }
        if (score > this.saveData.bestScoreToday) {
            this.saveData.bestScoreToday = score;
        }
    }

    private todayBestScore(): number {
        return this.saveData.bestScoreDate === this.todayKey() ? this.saveData.bestScoreToday : 0;
    }

    private todayKey(): string {
        const date = new Date();
        const month = this.twoDigit(date.getMonth() + 1);
        const day = this.twoDigit(date.getDate());
        return `${date.getFullYear()}-${month}-${day}`;
    }

    private twoDigit(value: number): string {
        return value < 10 ? `0${value}` : String(value);
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
            bestScoreToday: Math.max(0, Math.floor(Number(parsed?.bestScoreToday ?? 0))),
            bestScoreDate: typeof parsed?.bestScoreDate === 'string' ? parsed.bestScoreDate : '',
            totalCoins: Math.max(0, Math.floor(Number(parsed?.totalCoins ?? 0))),
            totalStars: Math.max(0, Math.floor(Number(parsed?.totalStars ?? 0))),
            totalRuns: Math.max(0, Math.floor(Number(parsed?.totalRuns ?? 0))),
            totalDistance: Math.max(0, Math.floor(Number(parsed?.totalDistance ?? 0))),
            selectedSkin: unlocked.indexOf(selected) >= 0 ? selected : 'classic',
            unlockedSkins: unlocked,
            upgrades: {
                magnet: this.saneLevel(parsed?.upgrades?.magnet),
                shield: this.saneLevel(parsed?.upgrades?.shield),
                score: this.saneLevel(parsed?.upgrades?.score),
                dash: this.saneLevel(parsed?.upgrades?.dash),
            },
            inventory: this.saneInventory(parsed?.inventory),
            reviveTicketsUsed: Math.max(0, Math.floor(Number(parsed?.reviveTicketsUsed ?? 0))),
            consumablesBought: Math.max(0, Math.floor(Number(parsed?.consumablesBought ?? 0))),
            missionsCompleted: Math.max(0, Math.floor(Number(parsed?.missionsCompleted ?? 0))),
            leaderboard: this.saneLeaderboard(parsed?.leaderboard),
            achievements: this.saneAchievements(parsed?.achievements),
            settings: this.saneSettings(parsed?.settings),
        };
    }

    private saneSettings(value: unknown): GameSettings {
        const source = typeof value === 'object' && value !== null ? value as Partial<GameSettings> : {};
        const language: Language = source.language === 'en' ? 'en' : 'zh';
        return {
            language,
            bgmVolume: this.clamp01(source.bgmVolume ?? DEFAULT_SETTINGS.bgmVolume),
            sfxVolume: this.clamp01(source.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume),
            assistHints: typeof source.assistHints === 'boolean' ? source.assistHints : DEFAULT_SETTINGS.assistHints,
        };
    }

    private saneInventory(value: unknown): ConsumableInventory {
        const source = typeof value === 'object' && value !== null ? value as Partial<ConsumableInventory> : {};
        return {
            startDash: Math.max(0, Math.floor(Number(source.startDash ?? 0))),
            reviveTicket: Math.max(0, Math.floor(Number(source.reviveTicket ?? 0))),
            startShield: Math.max(0, Math.floor(Number(source.startShield ?? 0))),
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
            coinSilver,
            coinBronze,
            coinFlying,
            diamond,
            magnet,
            shield,
            scoreStar,
            dash,
            fishDart,
            mysteryBox,
            fishProjectile,
            reviveTicket,
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
            turtleNormal,
            turtleShell,
            lowSign,
            hangingBell,
            button,
            panel,
            badge,
            logo,
            pauseIcon,
            achievementStar,
            resultBg,
            resultPanel,
            resultScore,
            resultCoin,
            resultDistance,
            resultBest,
            menuBestPanel,
            hudStatsPanel,
            activeItemBase,
            shopPanel,
            achievementPanel,
            settingsPanel,
            pausePanel,
            leaderboardPanel,
            cloudNormal,
            cloudBreak,
            cloudBounce,
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
            this.loadSpriteFrame('textures/items/coin_silver'),
            this.loadSpriteFrame('textures/items/coin_bronze'),
            this.loadSpriteFrame('textures/items/coin_flying'),
            this.loadSpriteFrame('textures/items/diamond'),
            this.loadSpriteFrame('textures/items/magnet'),
            this.loadSpriteFrame('textures/items/shield'),
            this.loadSpriteFrame('textures/items/score_star'),
            this.loadSpriteFrame('textures/items/dash'),
            this.loadSpriteFrame('textures/items/fish_dart'),
            this.loadSpriteFrame('textures/items/mystery_box'),
            this.loadSpriteFrame('textures/items/fish_projectile'),
            this.loadSpriteFrame('textures/items/revive_ticket'),
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
            this.loadSpriteFrame('textures/items/turtle_normal'),
            this.loadSpriteFrame('textures/items/turtle_shell'),
            this.loadSpriteFrame('textures/items/low_sign'),
            this.loadSpriteFrame('textures/items/hanging_bell'),
            this.loadSpriteFrame('textures/ui/button'),
            this.loadSpriteFrame('textures/ui/panel'),
            this.loadSpriteFrame('textures/ui/badge'),
            this.loadSpriteFrame('textures/ui/main_logo'),
            this.loadSpriteFrame('textures/ui/pause_icon'),
            this.loadSpriteFrame('textures/ui/achievement_star'),
            this.loadSpriteFrame('textures/ui/result/result_bg'),
            this.loadSpriteFrame('textures/ui/result/result_panel'),
            this.loadSpriteFrame('textures/ui/result/result_score'),
            this.loadSpriteFrame('textures/ui/result/result_coin'),
            this.loadSpriteFrame('textures/ui/result/result_distance'),
            this.loadSpriteFrame('textures/ui/result/result_best'),
            this.loadSpriteFrame('textures/ui/menu_best_panel'),
            this.loadSpriteFrame('textures/ui/hud_stats_panel'),
            this.loadSpriteFrame('textures/ui/active_item_base'),
            this.loadSpriteFrame('textures/ui/panels/shop_panel'),
            this.loadSpriteFrame('textures/ui/panels/achievement_panel'),
            this.loadSpriteFrame('textures/ui/panels/settings_panel'),
            this.loadSpriteFrame('textures/ui/panels/pause_panel'),
            this.loadSpriteFrame('textures/ui/panels/leaderboard_panel'),
            this.loadSpriteFrame('textures/casual/cloud_normal'),
            this.loadSpriteFrame('textures/casual/cloud_break'),
            this.loadSpriteFrame('textures/casual/cloud_bounce'),
            this.loadFont('fonts/DengXian-Bold'),
        ]);
        const [runnerRun, runnerJump, runnerSlide, runnerGlide] = await Promise.all([
            this.loadSpriteFrames('textures/runner/v2/run', 26),
            this.loadSpriteFrames('textures/runner/v2/jump_land', 18),
            this.loadSpriteFrames('textures/runner/v2/slide', 18),
            this.loadSpriteFrames('textures/runner/v2/glide_land', 20),
        ]);
        const achievementIcons = await this.loadSpriteFrames('textures/ui/achievements/achievement', 34);
        const classicSkin: RunnerSkinFrames = {
            preview: runnerRun[0],
            run: runnerRun,
            jump: runnerJump,
            fall: runnerJump[Math.min(12, runnerJump.length - 1)],
            glide: runnerGlide,
            slide: runnerSlide,
            power: {
                magnet: runnerPowerMagnet,
                shield: runnerPowerShield,
                dash: runnerPowerDash,
                score: runnerPowerScore,
            },
        };
        const [berrySkin, mintSkin] = await Promise.all([
            this.loadRunnerSkin('textures/runner/skins/berry'),
            this.loadRunnerSkin('textures/runner/skins/mint'),
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
            runnerSkins: {
                classic: classicSkin,
                berry: berrySkin,
                mint: mintSkin,
            },
            coin,
            coinSilver,
            coinBronze,
            coinFlying,
            diamond,
            magnet,
            shield,
            scoreStar,
            dash,
            fishDart,
            mysteryBox,
            fishProjectile,
            reviveTicket,
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
            turtleNormal,
            turtleShell,
            lowSign,
            hangingBell,
            button,
            panel,
            badge,
            logo,
            pauseIcon,
            achievementStar,
            achievementIcons,
            resultBg,
            resultPanel,
            resultScore,
            resultCoin,
            resultDistance,
            resultBest,
            menuBestPanel,
            hudStatsPanel,
            activeItemBase,
            shopPanel,
            achievementPanel,
            settingsPanel,
            pausePanel,
            leaderboardPanel,
            cloudNormal,
            cloudBreak,
            cloudBounce,
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

    private async loadRunnerSkin(resourceDir: string): Promise<RunnerSkinFrames> {
        const [run, jump, slide, glide, magnet, shield, dash, score] = await Promise.all([
            this.loadSpriteFrames(`${resourceDir}/run`, 26),
            this.loadSpriteFrames(`${resourceDir}/jump_land`, 18),
            this.loadSpriteFrames(`${resourceDir}/slide`, 18),
            this.loadSpriteFrames(`${resourceDir}/glide_land`, 20),
            this.loadSpriteFrame(`${resourceDir}/runner_power_magnet`),
            this.loadSpriteFrame(`${resourceDir}/runner_power_shield`),
            this.loadSpriteFrame(`${resourceDir}/runner_power_dash`),
            this.loadSpriteFrame(`${resourceDir}/runner_power_score`),
        ]);
        return {
            preview: run[0],
            run,
            jump,
            fall: jump[Math.min(12, jump.length - 1)],
            glide,
            slide,
            power: { magnet, shield, dash, score },
        };
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
