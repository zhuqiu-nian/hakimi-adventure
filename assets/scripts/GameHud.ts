import { _decorator, Color, Component, Font, Graphics, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';

const { ccclass } = _decorator;

export type PowerState = {
    magnet: number;
    shield: number;
    score: number;
    dash: number;
};

export type UpgradeLevels = Record<'magnet' | 'shield' | 'score' | 'dash', number>;

export type HudStats = {
    distance: number;
    runCoins: number;
    totalCoins: number;
    score: number;
    bestScore: number;
    multiplier: number;
    combo: number;
    missionText: string;
};

export type LeaderboardEntryView = {
    rank: number;
    score: number;
    distance: number;
    coins: number;
};

export type MissionView = {
    label: string;
    current: number;
    target: number;
    reward: number;
    completed: boolean;
};

export type AchievementView = {
    label: string;
    reward: number;
};

export type GameOverView = {
    score: number;
    runCoins: number;
    totalCoins: number;
    distance: number;
    reward: number;
    rank: number;
    missions: MissionView[];
    achievements: AchievementView[];
    leaderboard: LeaderboardEntryView[];
};

type LeaderboardRowLabels = {
    rank: Label;
    score: Label;
    distance: Label;
    coins: Label;
};

export type HudSaveView = {
    totalCoins: number;
    selectedSkin: string;
    upgrades: UpgradeLevels;
};

export type SkinView = {
    id: string;
    label: string;
    selected: boolean;
    unlocked: boolean;
    cost: number;
    color: Color;
};

export type HudIconFrames = {
    coin: SpriteFrame;
    diamond: SpriteFrame;
    magnet: SpriteFrame;
    shield: SpriteFrame;
    scoreStar: SpriteFrame;
    dash: SpriteFrame;
    badge: SpriteFrame;
    pause: SpriteFrame;
};

const TXT = {
    start: '\u5f00\u59cb\u5192\u9669',
    shop: '\u5546\u5e97',
    settings: '\u8bbe\u7f6e',
    rank: '\u6392\u884c',
    revive: '\u770b\u5e7f\u544a\u590d\u6d3b',
    giveUp: '\u7ed3\u675f',
    pause: '\u6682\u505c',
    resume: '\u7ee7\u7eed',
    menu: '\u4e3b\u83dc\u5355',
    back: '\u8fd4\u56de',
    retry: '\u518d\u8dd1\u4e00\u6b21',
    over: '\u5192\u9669\u7ed3\u675f',
    settingsTitle: '\u8bbe\u7f6e',
    settingsText: '\u70b9\u51fb / \u7a7a\u683c: \u8df3\u8dc3\n\u957f\u6309\u7a7a\u683c: \u6ed1\u7fd4\n\u65b9\u5411\u4e0b / S: \u4e0b\u6ed1',
    shopTitle: '\u54c8\u57fa\u7c73\u5546\u5e97',
    rankTitle: '\u5192\u9669\u6392\u884c\u699c',
    reviveTitle: '\u5dee\u4e00\u70b9\u5c31\u8fc7\u53bb\u5566',
    reviveText: '\u770b\u5b8c\u5e7f\u544a\u53ef\u4ee5\u539f\u5730\u590d\u6d3b\uff0c\u5e76\u83b7\u5f97\u77ed\u6682\u62a4\u76fe',
};

const POWER_NAMES: Record<keyof PowerState, string> = {
    magnet: '\u78c1\u94c1',
    shield: '\u62a4\u76fe',
    score: '\u53cc\u500d',
    dash: '\u51b2\u523a',
};

@ccclass('GameHud')
export class GameHud extends Component {
    private menuRoot: Node | null = null;
    private gameHudRoot: Node | null = null;
    private overlayRoot: Node | null = null;
    private currencyRoot: Node | null = null;
    private startNode: Node | null = null;
    private settingsNode: Node | null = null;
    private upgradeNode: Node | null = null;
    private leaderboardNode: Node | null = null;
    private pauseNode: Node | null = null;
    private continueNode: Node | null = null;
    private menuNode: Node | null = null;
    private settingsBackNode: Node | null = null;
    private upgradeBackNode: Node | null = null;
    private retryNode: Node | null = null;
    private resultMenuNode: Node | null = null;
    private resultShopNode: Node | null = null;
    private resultLeaderboardNode: Node | null = null;
    private leaderboardBackNode: Node | null = null;
    private reviveAdNode: Node | null = null;
    private reviveGiveUpNode: Node | null = null;
    private settingsPanel: Node | null = null;
    private upgradePanel: Node | null = null;
    private pausePanel: Node | null = null;
    private resultPanel: Node | null = null;
    private revivePanel: Node | null = null;
    private leaderboardShade: Node | null = null;
    private leaderboardPanel: Node | null = null;
    private diamondLabel: Label | null = null;
    private totalCoinLabel: Label | null = null;
    private scoreLabel: Label | null = null;
    private scoreShadowLabel: Label | null = null;
    private coinLabel: Label | null = null;
    private distanceLabel: Label | null = null;
    private distanceShadowLabel: Label | null = null;
    private multiplierLabel: Label | null = null;
    private comboLabel: Label | null = null;
    private missionLabel: Label | null = null;
    private resultTitleLabel: Label | null = null;
    private resultScoreLabel: Label | null = null;
    private resultDistanceLabel: Label | null = null;
    private resultCoinLabel: Label | null = null;
    private resultRewardLabel: Label | null = null;
    private resultMissionLabel: Label | null = null;
    private resultAchievementLabel: Label | null = null;
    private leaderboardRows: LeaderboardRowLabels[] = [];
    private upgradeCoinLabel: Label | null = null;
    private upgradeButtons: Partial<Record<keyof PowerState, Node>> = {};
    private upgradeLabels: Partial<Record<keyof PowerState, Label>> = {};
    private skinButtons: Record<string, Node> = {};
    private skinLabels: Record<string, Label> = {};
    private uiFont: Font | null = null;

    public build(buttonFrame: SpriteFrame | null, panelFrame: SpriteFrame | null, logoFrame: SpriteFrame | null, icons: HudIconFrames, uiFont: Font | null = null): void {
        this.uiFont = uiFont;
        this.menuRoot = this.makeNode('MenuRoot', this.node, Vec3.ZERO);
        this.gameHudRoot = this.makeNode('GameHudRoot', this.node, Vec3.ZERO);
        this.overlayRoot = this.makeNode('OverlayRoot', this.node, Vec3.ZERO);
        this.currencyRoot = this.makeNode('CurrencyRoot', this.node, Vec3.ZERO);
        this.buildCurrency(panelFrame, icons);
        this.buildMenu(buttonFrame, logoFrame);
        this.buildGameHud(icons);
        this.buildSettings(buttonFrame, panelFrame);
        this.buildPause(buttonFrame, panelFrame);
        this.buildRevive(buttonFrame, panelFrame);
        this.buildUpgrade(buttonFrame, panelFrame, icons);
        this.buildResult(buttonFrame, panelFrame);
        this.buildLeaderboard(buttonFrame, panelFrame);
        this.setMenu({ totalCoins: 0, selectedSkin: 'classic', upgrades: { magnet: 1, shield: 1, score: 1, dash: 1 } }, []);
    }

    public setMenu(save: HudSaveView, skins: SkinView[]): void {
        this.showOnly('menu');
        this.updateSaveView(save, skins);
    }

    public setSettings(): void {
        this.showOnly('settings');
    }

    public setUpgrade(save: HudSaveView, skins: SkinView[], costs: Record<keyof PowerState, number>): void {
        this.showOnly('upgrade');
        this.updateSaveView(save, skins);
        for (const kind of Object.keys(POWER_NAMES) as Array<keyof PowerState>) {
            const label = this.upgradeLabels[kind];
            if (label) {
                label.string = `${POWER_NAMES[kind]} Lv.${save.upgrades[kind]}  ${costs[kind]}`;
            }
        }
    }

    public setPlaying(): void {
        this.showOnly('game');
    }

    public setPause(): void {
        this.showOnly('pause');
    }

    public setRevive(): void {
        this.showOnly('revive');
    }

    public setGameOver(result: GameOverView): void {
        this.showOnly('result');
        const missionDone = result.missions.some((mission) => mission.completed);
        if (this.resultTitleLabel) this.resultTitleLabel.string = missionDone ? '\u5192\u9669\u7ed3\u675f  \u4efb\u52a1\u8fbe\u6210' : TXT.over;
        if (this.resultScoreLabel) this.resultScoreLabel.string = `\u5206\u6570 ${result.score}`;
        if (this.resultDistanceLabel) this.resultDistanceLabel.string = `\u91cc\u7a0b ${Math.floor(result.distance)}m`;
        if (this.resultCoinLabel) this.resultCoinLabel.string = `\u91d1\u5e01 ${result.runCoins}`;
        if (this.resultRewardLabel) this.resultRewardLabel.string = `\u603b\u5956\u52b1 +${result.reward}    \u6392\u540d #${result.rank}`;
        if (this.resultMissionLabel) this.resultMissionLabel.string = result.missions.map((mission) => `${mission.completed ? '\u2713' : '-'} ${mission.label} +${mission.completed ? mission.reward : 0}`).join('   ');
        if (this.resultAchievementLabel) this.resultAchievementLabel.string = result.achievements.length > 0
            ? result.achievements.map((achievement) => `\u65b0\u6210\u5c31: ${achievement.label} +${achievement.reward}`).join('   ')
            : '\u6210\u5c31: \u7ee7\u7eed\u5192\u9669\u5373\u53ef\u89e3\u9501';
        if (this.totalCoinLabel) this.totalCoinLabel.string = String(result.totalCoins);
    }

    public setLeaderboard(entries: LeaderboardEntryView[]): void {
        this.setNodeVisible(this.overlayRoot, true);
        this.setNodeVisible(this.leaderboardShade, true);
        this.setNodeVisible(this.leaderboardPanel, true);
        for (let i = 0; i < this.leaderboardRows.length; i++) {
            const entry = entries[i];
            const row = this.leaderboardRows[i];
            row.rank.string = `#${entry?.rank ?? i + 1}`;
            row.score.string = entry ? `${entry.score}\u5206` : '--';
            row.distance.string = entry ? `${Math.floor(entry.distance)}m` : '--';
            row.coins.string = entry ? `${entry.coins}\u91d1\u5e01` : '--';
        }
    }

    public closeLeaderboard(): void {
        this.setNodeVisible(this.leaderboardShade, false);
        this.setNodeVisible(this.leaderboardPanel, false);
    }

    public updateStats(stats: HudStats): void {
        const scoreText = `\u5206\u6570 ${Math.floor(stats.score)}`;
        if (this.scoreLabel) this.scoreLabel.string = scoreText;
        if (this.scoreShadowLabel) this.scoreShadowLabel.string = scoreText;
        if (this.coinLabel) this.coinLabel.string = `\u91d1\u5e01 ${stats.runCoins}`;
        const distanceText = `\u91cc\u7a0b ${Math.floor(stats.distance)}m`;
        if (this.distanceLabel) this.distanceLabel.string = distanceText;
        if (this.distanceShadowLabel) this.distanceShadowLabel.string = distanceText;
        if (this.multiplierLabel) this.multiplierLabel.string = `x${stats.multiplier.toFixed(2)}`;
        if (this.comboLabel) this.comboLabel.string = stats.combo > 0 ? `\u8fde\u51fb ${stats.combo}` : '';
        if (this.missionLabel) this.missionLabel.string = stats.missionText;
    }

    public updatePowers(_powers: PowerState, _maxPowers: PowerState): void {
    }

    public getStartNode(): Node | null { return this.startNode; }
    public getSettingsNode(): Node | null { return this.settingsNode; }
    public getUpgradeNode(): Node | null { return this.upgradeNode; }
    public getLeaderboardNode(): Node | null { return this.leaderboardNode; }
    public getPauseNode(): Node | null { return this.pauseNode; }
    public getContinueNode(): Node | null { return this.continueNode; }
    public getMenuNode(): Node | null { return this.menuNode; }
    public getSettingsBackNode(): Node | null { return this.settingsBackNode; }
    public getUpgradeBackNode(): Node | null { return this.upgradeBackNode; }
    public getRetryNode(): Node | null { return this.retryNode; }
    public getResultMenuNode(): Node | null { return this.resultMenuNode; }
    public getResultShopNode(): Node | null { return this.resultShopNode; }
    public getResultLeaderboardNode(): Node | null { return this.resultLeaderboardNode; }
    public getLeaderboardBackNode(): Node | null { return this.leaderboardBackNode; }
    public getReviveAdNode(): Node | null { return this.reviveAdNode; }
    public getReviveGiveUpNode(): Node | null { return this.reviveGiveUpNode; }
    public getUpgradeButton(kind: keyof PowerState): Node | null { return this.upgradeButtons[kind] ?? null; }
    public getSkinButton(id: string): Node | null { return this.skinButtons[id] ?? null; }

    private buildCurrency(_panelFrame: SpriteFrame | null, icons: HudIconFrames): void {
        if (!this.currencyRoot) return;
        const diamond = this.makeCurrencyPill('DiamondCurrency', new Vec3(426, 318, 0), icons.diamond, new Color(75, 104, 172, 255));
        this.diamondLabel = diamond.label;
        const coin = this.makeCurrencyPill('CoinCurrency', new Vec3(558, 318, 0), icons.coin, new Color(157, 97, 24, 255));
        this.totalCoinLabel = coin.label;
    }

    private buildMenu(buttonFrame: SpriteFrame | null, logoFrame: SpriteFrame | null): void {
        if (!this.menuRoot) return;
        this.makeImage('MainLogo', logoFrame, new Vec3(0, 140, 0), 430, 238, this.menuRoot);
        this.startNode = this.makeButton('StartButton', buttonFrame, new Vec3(-360, -214, 0), TXT.start, this.menuRoot, 160, 54, 21).node;
        this.upgradeNode = this.makeButton('ShopButton', buttonFrame, new Vec3(-120, -214, 0), TXT.shop, this.menuRoot, 160, 54, 21).node;
        this.leaderboardNode = this.makeButton('LeaderboardButton', buttonFrame, new Vec3(120, -214, 0), TXT.rank, this.menuRoot, 160, 54, 21).node;
        this.settingsNode = this.makeButton('SettingsButton', buttonFrame, new Vec3(360, -214, 0), TXT.settings, this.menuRoot, 160, 54, 21).node;
    }

    private buildGameHud(icons: HudIconFrames): void {
        if (!this.gameHudRoot) return;
        this.scoreShadowLabel = this.makeLabel('ScoreShadowLabel', '\u5206\u6570 0', 34, new Vec3(-472, 312, 0), new Color(117, 65, 45, 220), 430, this.gameHudRoot);
        this.scoreLabel = this.makeLabel('ScoreLabel', '\u5206\u6570 0', 34, new Vec3(-476, 318, 0), new Color(255, 238, 158, 255), 430, this.gameHudRoot);
        this.scoreShadowLabel.isBold = true;
        this.scoreLabel.isBold = true;
        this.scoreShadowLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.scoreLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.distanceShadowLabel = this.makeLabel('DistanceShadowLabel', '\u91cc\u7a0b 0m', 22, new Vec3(-472, 282, 0), new Color(90, 58, 48, 210), 360, this.gameHudRoot);
        this.distanceLabel = this.makeLabel('DistanceLabel', '\u91cc\u7a0b 0m', 22, new Vec3(-476, 286, 0), new Color(149, 229, 238, 255), 360, this.gameHudRoot);
        this.distanceShadowLabel.isBold = true;
        this.distanceLabel.isBold = true;
        this.distanceShadowLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.distanceLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.pauseNode = this.makeImage('PauseButton', icons.pause, new Vec3(596, 320, 0), 34, 34, this.gameHudRoot);
        this.comboLabel = this.makeLabel('ComboLabel', '', 23, new Vec3(0, 226, 0), new Color(255, 152, 84, 255), 260, this.gameHudRoot);
        this.missionLabel = this.makeLabel('MissionLabel', '', 18, new Vec3(0, 316, 0), new Color(94, 110, 132, 230), 540, this.gameHudRoot);
    }

    private buildSettings(buttonFrame: SpriteFrame | null, panelFrame: SpriteFrame | null): void {
        if (!this.overlayRoot) return;
        this.settingsPanel = this.makePanel('SettingsPanel', panelFrame, new Vec3(0, 24, 0), 740, 340, this.overlayRoot);
        this.makeLabel('SettingsTitle', TXT.settingsTitle, 36, new Vec3(0, 106, 0), new Color(92, 65, 62, 255), 500, this.settingsPanel);
        this.makeLabel('SettingsText', TXT.settingsText, 23, new Vec3(0, 22, 0), new Color(88, 95, 101, 255), 600, this.settingsPanel);
        this.settingsBackNode = this.makeButton('SettingsBackButton', buttonFrame, new Vec3(0, -112, 0), TXT.back, this.settingsPanel, 220, 62, 24).node;
    }

    private buildPause(buttonFrame: SpriteFrame | null, panelFrame: SpriteFrame | null): void {
        if (!this.overlayRoot) return;
        this.pausePanel = this.makePanel('PausePanel', panelFrame, new Vec3(0, 22, 0), 620, 280, this.overlayRoot);
        this.makeLabel('PauseTitle', '\u6682\u505c\u4e2d', 38, new Vec3(0, 84, 0), new Color(92, 65, 62, 255), 450, this.pausePanel);
        this.continueNode = this.makeButton('ContinueButton', buttonFrame, new Vec3(-140, -74, 0), TXT.resume, this.pausePanel, 176, 54, 22).node;
        this.menuNode = this.makeButton('PauseMenuButton', buttonFrame, new Vec3(140, -74, 0), TXT.menu, this.pausePanel, 176, 54, 22).node;
    }

    private buildRevive(buttonFrame: SpriteFrame | null, panelFrame: SpriteFrame | null): void {
        if (!this.overlayRoot) return;
        this.revivePanel = this.makePanel('RevivePanel', panelFrame, new Vec3(0, 38, 0), 680, 300, this.overlayRoot);
        this.makeLabel('ReviveTitle', TXT.reviveTitle, 34, new Vec3(0, 92, 0), new Color(92, 65, 62, 255), 520, this.revivePanel);
        this.makeLabel('ReviveText', TXT.reviveText, 22, new Vec3(0, 30, 0), new Color(88, 95, 101, 255), 560, this.revivePanel);
        this.reviveAdNode = this.makeButton('ReviveAdButton', buttonFrame, new Vec3(-150, -82, 0), TXT.revive, this.revivePanel, 220, 58, 20).node;
        this.reviveGiveUpNode = this.makeButton('ReviveGiveUpButton', buttonFrame, new Vec3(150, -82, 0), TXT.giveUp, this.revivePanel, 180, 58, 22).node;
    }

    private buildUpgrade(buttonFrame: SpriteFrame | null, panelFrame: SpriteFrame | null, icons: HudIconFrames): void {
        if (!this.overlayRoot) return;
        this.upgradePanel = this.makePanel('UpgradePanel', panelFrame, new Vec3(0, 18, 0), 950, 510, this.overlayRoot);
        this.makeLabel('UpgradeTitle', TXT.shopTitle, 34, new Vec3(0, 206, 0), new Color(92, 65, 62, 255), 600, this.upgradePanel);
        this.upgradeCoinLabel = this.makeLabel('UpgradeCoinLabel', '\u91d1\u5e01 0', 22, new Vec3(0, 168, 0), new Color(157, 97, 24, 255), 320, this.upgradePanel);
        const rows: Array<{ kind: keyof PowerState; frame: SpriteFrame; pos: Vec3 }> = [
            { kind: 'magnet', frame: icons.magnet, pos: new Vec3(-230, 96, 0) },
            { kind: 'shield', frame: icons.shield, pos: new Vec3(230, 96, 0) },
            { kind: 'score', frame: icons.scoreStar, pos: new Vec3(-230, 26, 0) },
            { kind: 'dash', frame: icons.dash, pos: new Vec3(230, 26, 0) },
        ];
        for (const row of rows) {
            const button = this.makeButton(`Upgrade_${row.kind}`, buttonFrame, row.pos, '', this.upgradePanel, 360, 56, 19);
            this.makeImage(`UpgradeIcon_${row.kind}`, row.frame, new Vec3(-146, 0, 0), 34, 34, button.node);
            button.label.node.setPosition(new Vec3(34, 0, 0));
            button.label.getComponent(UITransform)?.setContentSize(250, 42);
            this.upgradeButtons[row.kind] = button.node;
            this.upgradeLabels[row.kind] = button.label;
        }
        this.makeLabel('SkinTitle', '\u76ae\u80a4', 26, new Vec3(0, -44, 0), new Color(92, 65, 62, 255), 260, this.upgradePanel);
        [
            { id: 'classic', label: '\u7ecf\u5178' },
            { id: 'berry', label: '\u8349\u8393' },
            { id: 'mint', label: '\u8584\u8377' },
        ].forEach((skin, index) => {
            const button = this.makeButton(`Skin_${skin.id}`, buttonFrame, new Vec3(-220 + index * 220, -104, 0), skin.label, this.upgradePanel, 190, 58, 21);
            this.skinButtons[skin.id] = button.node;
            this.skinLabels[skin.id] = button.label;
        });
        this.upgradeBackNode = this.makeButton('UpgradeBackButton', buttonFrame, new Vec3(0, -196, 0), TXT.back, this.upgradePanel, 220, 62, 24).node;
    }

    private buildResult(buttonFrame: SpriteFrame | null, panelFrame: SpriteFrame | null): void {
        if (!this.overlayRoot) return;
        this.resultPanel = this.makePanel('ResultPanel', panelFrame, new Vec3(0, 42, 0), 920, 468, this.overlayRoot);
        this.resultTitleLabel = this.makeLabel('ResultTitle', TXT.over, 32, new Vec3(0, 178, 0), new Color(92, 65, 62, 255), 650, this.resultPanel);
        this.resultScoreLabel = this.makeLabel('ResultScore', '', 23, new Vec3(-220, 112, 0), new Color(82, 71, 72, 255), 250, this.resultPanel);
        this.resultDistanceLabel = this.makeLabel('ResultDistance', '', 23, new Vec3(220, 112, 0), new Color(48, 139, 139, 255), 250, this.resultPanel);
        this.resultCoinLabel = this.makeLabel('ResultCoin', '', 22, new Vec3(-220, 70, 0), new Color(157, 97, 24, 255), 250, this.resultPanel);
        this.resultRewardLabel = this.makeLabel('ResultReward', '', 22, new Vec3(220, 70, 0), new Color(98, 87, 133, 255), 340, this.resultPanel);
        this.resultMissionLabel = this.makeLabel('ResultMission', '', 18, new Vec3(0, 20, 0), new Color(88, 95, 101, 255), 800, this.resultPanel);
        this.resultAchievementLabel = this.makeLabel('ResultAchievement', '', 18, new Vec3(0, -24, 0), new Color(190, 115, 54, 255), 800, this.resultPanel);
        this.retryNode = this.makeButton('RetryButton', buttonFrame, new Vec3(-330, -174, 0), TXT.retry, this.resultPanel, 154, 54, 19).node;
        this.resultShopNode = this.makeButton('ResultShopButton', buttonFrame, new Vec3(-110, -174, 0), TXT.shop, this.resultPanel, 154, 54, 19).node;
        this.resultLeaderboardNode = this.makeButton('ResultLeaderboardButton', buttonFrame, new Vec3(110, -174, 0), TXT.rank, this.resultPanel, 154, 54, 19).node;
        this.resultMenuNode = this.makeButton('ResultMenuButton', buttonFrame, new Vec3(330, -174, 0), TXT.menu, this.resultPanel, 154, 54, 19).node;
    }

    private buildLeaderboard(buttonFrame: SpriteFrame | null, panelFrame: SpriteFrame | null): void {
        if (!this.overlayRoot) return;
        this.leaderboardShade = this.makeNode('LeaderboardShade', this.overlayRoot, Vec3.ZERO);
        const shadeTransform = this.leaderboardShade.addComponent(UITransform);
        shadeTransform.setContentSize(1280, 720);
        const shade = this.leaderboardShade.addComponent(Graphics);
        shade.fillColor = new Color(41, 46, 58, 94);
        shade.rect(-640, -360, 1280, 720);
        shade.fill();
        this.leaderboardPanel = this.makePanel('LeaderboardPanel', panelFrame, new Vec3(0, 34, 0), 720, 492, this.overlayRoot);
        this.makeLabel('LeaderboardTitle', TXT.rankTitle, 34, new Vec3(0, 196, 0), new Color(92, 65, 62, 255), 520, this.leaderboardPanel);
        this.makeLeaderboardHeader();
        this.leaderboardRows = [];
        for (let i = 0; i < 10; i++) {
            const y = 106 - i * 30;
            const color = i < 3 ? new Color(190, 115, 54, 255) : new Color(74, 112, 143, 255);
            this.makeLeaderboardRowBg(`LeaderboardRowBg_${i}`, y, i % 2 === 0);
            this.leaderboardRows.push({
                rank: this.makeLabel(`LeaderboardRank_${i}`, `#${i + 1}`, 18, new Vec3(-230, y, 0), color, 84, this.leaderboardPanel),
                score: this.makeLabel(`LeaderboardScore_${i}`, '--', 18, new Vec3(-78, y, 0), color, 144, this.leaderboardPanel),
                distance: this.makeLabel(`LeaderboardDistance_${i}`, '--', 18, new Vec3(78, y, 0), color, 120, this.leaderboardPanel),
                coins: this.makeLabel(`LeaderboardCoins_${i}`, '--', 18, new Vec3(224, y, 0), color, 138, this.leaderboardPanel),
            });
        }
        this.leaderboardBackNode = this.makeButton('LeaderboardBackButton', buttonFrame, new Vec3(0, -196, 0), TXT.back, this.leaderboardPanel, 190, 54, 21).node;
    }

    private makeLeaderboardHeader(): void {
        if (!this.leaderboardPanel) return;
        const y = 146;
        this.makeLabel('LeaderboardHeaderRank', '\u540d\u6b21', 19, new Vec3(-230, y, 0), new Color(137, 92, 52, 255), 84, this.leaderboardPanel);
        this.makeLabel('LeaderboardHeaderScore', '\u5206\u6570', 19, new Vec3(-78, y, 0), new Color(137, 92, 52, 255), 144, this.leaderboardPanel);
        this.makeLabel('LeaderboardHeaderDistance', '\u91cc\u7a0b', 19, new Vec3(78, y, 0), new Color(137, 92, 52, 255), 120, this.leaderboardPanel);
        this.makeLabel('LeaderboardHeaderCoins', '\u91d1\u5e01', 19, new Vec3(224, y, 0), new Color(137, 92, 52, 255), 138, this.leaderboardPanel);
        this.makeLeaderboardLine('LeaderboardHeaderLine', 126, 2, new Color(209, 138, 70, 160));
    }

    private makeLeaderboardRowBg(name: string, y: number, tinted: boolean): void {
        if (!this.leaderboardPanel) return;
        const node = this.makeNode(name, this.leaderboardPanel, new Vec3(0, y, 0));
        const transform = node.addComponent(UITransform);
        transform.setContentSize(570, 28);
        const bg = node.addComponent(Graphics);
        bg.fillColor = tinted ? new Color(255, 238, 190, 70) : new Color(255, 255, 255, 30);
        bg.roundRect(-285, -14, 570, 28, 8);
        bg.fill();
        this.makeLeaderboardLine(`${name}_Line`, y - 15, 1, new Color(216, 156, 92, 80));
    }

    private makeLeaderboardLine(name: string, y: number, height: number, color: Color): void {
        if (!this.leaderboardPanel) return;
        const node = this.makeNode(name, this.leaderboardPanel, new Vec3(0, y, 0));
        const transform = node.addComponent(UITransform);
        transform.setContentSize(570, height);
        const line = node.addComponent(Graphics);
        line.fillColor = color;
        line.rect(-285, -height * 0.5, 570, height);
        line.fill();
    }

    private showOnly(mode: 'menu' | 'game' | 'settings' | 'upgrade' | 'pause' | 'revive' | 'result'): void {
        this.setNodeVisible(this.menuRoot, mode === 'menu');
        this.setNodeVisible(this.gameHudRoot, mode === 'game' || mode === 'pause' || mode === 'revive');
        this.setNodeVisible(this.currencyRoot, mode === 'menu' || mode === 'upgrade' || mode === 'settings' || mode === 'result');
        this.setNodeVisible(this.overlayRoot, mode === 'settings' || mode === 'upgrade' || mode === 'pause' || mode === 'revive' || mode === 'result');
        this.setNodeVisible(this.settingsPanel, mode === 'settings');
        this.setNodeVisible(this.upgradePanel, mode === 'upgrade');
        this.setNodeVisible(this.pausePanel, mode === 'pause');
        this.setNodeVisible(this.revivePanel, mode === 'revive');
        this.setNodeVisible(this.resultPanel, mode === 'result');
        this.setNodeVisible(this.leaderboardShade, false);
        this.setNodeVisible(this.leaderboardPanel, false);
    }

    private updateSaveView(save: HudSaveView, skins: SkinView[]): void {
        if (this.totalCoinLabel) this.totalCoinLabel.string = String(save.totalCoins);
        if (this.upgradeCoinLabel) this.upgradeCoinLabel.string = `\u91d1\u5e01 ${save.totalCoins}`;
        for (const skin of skins) {
            const label = this.skinLabels[skin.id];
            const node = this.skinButtons[skin.id];
            if (label) label.string = skin.selected ? `${skin.label} \u2713` : skin.unlocked ? skin.label : `${skin.label} ${skin.cost}`;
            const sprite = node?.getComponent(Sprite);
            if (sprite) sprite.color = skin.selected ? new Color(255, 245, 184, 255) : skin.unlocked ? new Color(255, 255, 255, 255) : new Color(205, 218, 224, 255);
        }
    }

    private makeButton(name: string, frame: SpriteFrame | null, pos: Vec3, text: string, parent = this.node, width = 300, height = 90, fontSize = 30): { node: Node; label: Label } {
        const node = this.makeImage(name, frame, pos, width, height, parent);
        const label = this.makeLabel(`${name}Text`, text, fontSize, Vec3.ZERO, new Color(111, 64, 39, 255), width - 28, node);
        return { node, label };
    }

    private makeCurrencyPill(name: string, pos: Vec3, iconFrame: SpriteFrame, textColor: Color): { node: Node; label: Label } {
        const node = this.makeNode(name, this.currencyRoot ?? this.node, pos);
        const transform = node.addComponent(UITransform);
        transform.setContentSize(126, 42);
        const bg = node.addComponent(Graphics);
        bg.fillColor = new Color(255, 244, 203, 224);
        bg.strokeColor = new Color(170, 105, 48, 190);
        bg.lineWidth = 2;
        bg.roundRect(-63, -21, 126, 42, 16);
        bg.fill();
        bg.stroke();
        this.makeImage(`${name}Icon`, iconFrame, new Vec3(-39, 0, 0), 24, 24, node);
        const label = this.makeLabel(`${name}Label`, '0', 22, new Vec3(18, 0, 0), textColor, 76, node);
        return { node, label };
    }

    private makePanel(name: string, frame: SpriteFrame | null, pos: Vec3, width: number, height: number, parent = this.node): Node {
        return this.makeImage(name, frame, pos, width, height, parent);
    }

    private makeImage(name: string, frame: SpriteFrame | null, pos: Vec3, width: number, height: number, parent = this.node): Node {
        const node = new Node(name);
        parent.addChild(node);
        node.setPosition(pos);
        const transform = node.addComponent(UITransform);
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        if (frame) sprite.spriteFrame = frame;
        transform.setContentSize(width, height);
        return node;
    }

    private makeLabel(name: string, text: string, fontSize: number, pos: Vec3, color: Color, width: number, parent = this.node): Label {
        const node = new Node(name);
        parent.addChild(node);
        node.setPosition(pos);
        const transform = node.addComponent(UITransform);
        transform.setContentSize(width, fontSize * 2.5);
        const label = node.addComponent(Label);
        if (this.uiFont) {
            label.font = this.uiFont;
        }
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 8;
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        return label;
    }

    private makeNode(name: string, parent: Node, pos: Vec3): Node {
        const node = new Node(name);
        parent.addChild(node);
        node.setPosition(pos);
        return node;
    }

    private setNodeVisible(node: Node | undefined | null, visible: boolean): void {
        if (node) node.active = visible;
    }
}
