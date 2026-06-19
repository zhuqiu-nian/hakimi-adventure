import { _decorator, Color, Component, Font, Graphics, Label, Mask, Node, ScrollView, Sprite, SpriteFrame, tween, Tween, UITransform, Vec3 } from 'cc';

const { ccclass } = _decorator;

export type PowerState = {
    magnet: number;
    shield: number;
    score: number;
    dash: number;
};

export type ConsumableKind = 'startDash' | 'reviveTicket' | 'startShield';
export type ShopTab = 'buy' | 'upgrade' | 'character' | 'skin';
export type UpgradeLevels = Record<'magnet' | 'shield' | 'score' | 'dash', number>;
export type ConsumableInventory = Record<ConsumableKind, number>;

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

export type Language = 'zh' | 'en';

export type SettingsView = {
    language: Language;
    bgmVolume: number;
    sfxVolume: number;
    assistHints: boolean;
};

export type LeaderboardEntryView = {
    rank: number;
    score: number;
    distance: number;
    coins: number;
    isCurrent?: boolean;
};

export type MissionView = {
    label: string;
    current: number;
    target: number;
    reward: number;
    completed: boolean;
};

export type AchievementView = {
    id?: string;
    label: string;
    reward: number;
    icon?: SpriteFrame;
};

export type AchievementEntryView = {
    id: string;
    label: string;
    description: string;
    stars: number;
    completed: boolean;
};

export type GameOverView = {
    score: number;
    runCoins: number;
    totalCoins: number;
    distance: number;
    bestScore: number;
    reward: number;
    rank: number;
    missions: MissionView[];
    achievements: AchievementView[];
    leaderboard: LeaderboardEntryView[];
};

type LeaderboardRowLabels = {
    bg: Graphics;
    line: Graphics;
    rank: Label;
    score: Label;
    distance: Label;
    coins: Label;
};

type AchievementRowView = {
    root: Node;
    bg: Graphics;
    icon: Sprite;
    title: Label;
    desc: Label;
    reward: Label;
};

type PowerTimerRow = {
    root: Node;
    fill: Graphics;
    label: Label;
};

export type HudSaveView = {
    totalCoins: number;
    totalStars: number;
    bestScore: number;
    bestScoreToday: number;
    selectedSkin: string;
    upgrades: UpgradeLevels;
    inventory: ConsumableInventory;
};

export type ConsumableShopView = {
    id: ConsumableKind;
    label: string;
    description: string;
    cost: number;
    count: number;
};

export type SkinView = {
    id: string;
    label: string;
    shortLabel: string;
    selected: boolean;
    unlocked: boolean;
    cost: number;
    preview: SpriteFrame;
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
    reviveTicket: SpriteFrame;
    activeItemBase: SpriteFrame;
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
    shopPanel: SpriteFrame;
    achievementPanel: SpriteFrame;
    settingsPanel: SpriteFrame;
    pausePanel: SpriteFrame;
    leaderboardPanel: SpriteFrame;
    cloudNormal: SpriteFrame;
    cloudBreak: SpriteFrame;
    cloudBounce: SpriteFrame;
};

const TXT = {
    start: '\u5f00\u59cb\u5192\u9669',
    shop: '\u5546\u5e97',
    settings: '\u8bbe\u7f6e',
    rank: '\u6392\u884c',
    achievements: '\u6210\u5c31',
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
    achievementsTitle: '\u6210\u5c31\u661f\u5149\u518c',
    reviveTitle: '\u5dee\u4e00\u70b9\u5c31\u8fc7\u53bb\u5566',
    reviveText: '\u770b\u5b8c\u5e7f\u544a\u53ef\u4ee5\u539f\u5730\u590d\u6d3b\uff0c\u5e76\u83b7\u5f97\u77ed\u6682\u62a4\u76fe',
};

type TextMap = typeof TXT;

const TEXTS: Record<Language, TextMap> = {
    zh: TXT,
    en: {
        start: 'Start',
        shop: 'Shop',
        settings: 'Settings',
        rank: 'Rank',
        achievements: 'Achievements',
        revive: 'Revive',
        giveUp: 'End',
        pause: 'Pause',
        resume: 'Resume',
        menu: 'Menu',
        back: 'Back',
        retry: 'Retry',
        over: 'Adventure Over',
        settingsTitle: 'Settings',
        settingsText: 'Tap / Space: Jump\nHold Space: Glide\nDown / S: Slide',
        shopTitle: 'Hakimi Shop',
        rankTitle: 'Adventure Ranking',
        achievementsTitle: 'Achievements',
        reviveTitle: 'So close!',
        reviveText: 'Revive in place and gain a short shield.',
    },
};

const SETTINGS_TEXT = {
    zh: {
        controlsTitle: '操作按键',
        controlsText: '跳跃：空格 / W / ↑\n二段跳：空中再按一次\n滑翔：空中长按空格\n下滑：S / ↓\n暂停：P\n开始：Enter\n返回：Esc',
        language: '语言',
        bgm: '背景音乐',
        sfx: '音效',
        assist: '操作辅助提示',
        data: '数据管理',
        resetSave: '重置存档',
        resetRank: '清空排行',
        on: '开',
        off: '关',
    },
    en: {
        controlsTitle: 'Controls',
        controlsText: 'Jump: Space / W / ↑\nDouble: press again in air\nGlide: hold Space\nSlide: S / ↓\nPause: P\nStart: Enter\nBack: Esc',
        language: 'Language',
        bgm: 'BGM',
        sfx: 'SFX',
        assist: 'Assist Hints',
        data: 'Data',
        resetSave: 'Reset Save',
        resetRank: 'Clear Rank',
        on: 'On',
        off: 'Off',
    },
};

type SettingsTextMap = (typeof SETTINGS_TEXT)[Language];

const POWER_NAMES: Record<keyof PowerState, string> = {
    magnet: '\u78c1\u94c1',
    shield: '\u62a4\u76fe',
    score: '\u53cc\u500d',
    dash: '\u51b2\u523a',
};

const POWER_NAMES_I18N: Record<Language, Record<keyof PowerState, string>> = {
    zh: POWER_NAMES,
    en: {
        magnet: 'Magnet',
        shield: 'Shield',
        score: 'Double',
        dash: 'Dash',
    },
};

@ccclass('GameHud')
export class GameHud extends Component {
    private menuRoot: Node | null = null;
    private gameHudRoot: Node | null = null;
    private overlayRoot: Node | null = null;
    private currencyRoot: Node | null = null;
    private startNode: Node | null = null;
    private casualNode: Node | null = null;
    private settingsNode: Node | null = null;
    private upgradeNode: Node | null = null;
    private leaderboardNode: Node | null = null;
    private achievementsNode: Node | null = null;
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
    private resultBgNode: Node | null = null;
    private revivePanel: Node | null = null;
    private leaderboardShade: Node | null = null;
    private leaderboardPanel: Node | null = null;
    private achievementsPanel: Node | null = null;
    private achievementsBackNode: Node | null = null;
    private diamondLabel: Label | null = null;
    private totalCoinLabel: Label | null = null;
    private totalStarLabel: Label | null = null;
    private menuBestTodayLabel: Label | null = null;
    private menuBestAllLabel: Label | null = null;
    private scoreLabel: Label | null = null;
    private scoreShadowLabel: Label | null = null;
    private coinLabel: Label | null = null;
    private distanceLabel: Label | null = null;
    private distanceShadowLabel: Label | null = null;
    private multiplierLabel: Label | null = null;
    private comboLabel: Label | null = null;
    private missionLabel: Label | null = null;
    private missionToastNode: Node | null = null;
    private missionToastLabel: Label | null = null;
    private reviveTextLabel: Label | null = null;
    private reviveAdLabel: Label | null = null;
    private achievementNoticeNode: Node | null = null;
    private achievementNoticeLabel: Label | null = null;
    private achievementNoticeIcon: Sprite | null = null;
    private resultTitleLabel: Label | null = null;
    private resultScoreLabel: Label | null = null;
    private resultDistanceLabel: Label | null = null;
    private resultCoinLabel: Label | null = null;
    private resultRewardLabel: Label | null = null;
    private resultMissionLabel: Label | null = null;
    private resultAchievementLabel: Label | null = null;
    private leaderboardEmptyLabel: Label | null = null;
    private settingsLanguageValueLabel: Label | null = null;
    private settingsBgmValueLabel: Label | null = null;
    private settingsSfxValueLabel: Label | null = null;
    private settingsAssistValueLabel: Label | null = null;
    private leaderboardRows: LeaderboardRowLabels[] = [];
    private upgradeCoinLabel: Label | null = null;
    private shopTabNodes: Partial<Record<ShopTab, Node>> = {};
    private shopTabLabels: Partial<Record<ShopTab, Label>> = {};
    private shopContentRoots: Partial<Record<ShopTab, Node>> = {};
    private upgradeButtons: Partial<Record<keyof PowerState, Node>> = {};
    private upgradeLabels: Partial<Record<keyof PowerState, Label>> = {};
    private consumableButtons: Partial<Record<ConsumableKind, Node>> = {};
    private consumableLabels: Partial<Record<ConsumableKind, Label>> = {};
    private achievementRows: AchievementRowView[] = [];
    private achievementContent: Node | null = null;
    private skinButtons: Record<string, Node> = {};
    private skinCardBgs: Record<string, Graphics> = {};
    private skinLabels: Record<string, Label> = {};
    private skinPreviewSprites: Record<string, Sprite> = {};
    private powerTimerRows: Partial<Record<keyof PowerState, PowerTimerRow>> = {};
    private activeItemNode: Node | null = null;
    private activeItemIcon: Sprite | null = null;
    private uiFont: Font | null = null;
    private language: Language = 'zh';
    private settingsLanguageNode: Node | null = null;
    private settingsBgmMinusNode: Node | null = null;
    private settingsBgmPlusNode: Node | null = null;
    private settingsSfxMinusNode: Node | null = null;
    private settingsSfxPlusNode: Node | null = null;
    private settingsAssistNode: Node | null = null;
    private settingsResetSaveNode: Node | null = null;
    private settingsResetRankNode: Node | null = null;
    private readonly powerKinds: Array<keyof PowerState> = ['magnet', 'shield', 'score', 'dash'];

    public build(buttonFrame: SpriteFrame | null, panelFrame: SpriteFrame | null, logoFrame: SpriteFrame | null, icons: HudIconFrames, uiFont: Font | null = null): void {
        this.uiFont = uiFont;
        this.menuRoot = this.makeNode('MenuRoot', this.node, Vec3.ZERO);
        this.gameHudRoot = this.makeNode('GameHudRoot', this.node, Vec3.ZERO);
        this.overlayRoot = this.makeNode('OverlayRoot', this.node, Vec3.ZERO);
        this.currencyRoot = this.makeNode('CurrencyRoot', this.node, Vec3.ZERO);
        this.buildCurrency(panelFrame, icons);
        this.buildMenu(buttonFrame, logoFrame, icons);
        this.buildGameHud(icons);
        this.buildSettings(buttonFrame, icons);
        this.buildPause(buttonFrame, icons);
        this.buildRevive(buttonFrame, panelFrame);
        this.buildUpgrade(buttonFrame, panelFrame, icons);
        this.buildResult(buttonFrame, icons);
        this.buildLeaderboard(buttonFrame, icons);
        this.buildAchievements(buttonFrame, icons, icons.achievementIcons, icons.achievementStar);
        this.buildAchievementNotice(icons.achievementStar);
        this.buildMissionToast();
        this.setMenu({ totalCoins: 0, totalStars: 0, bestScore: 0, bestScoreToday: 0, selectedSkin: 'classic', upgrades: { magnet: 1, shield: 1, score: 1, dash: 1 }, inventory: { startDash: 0, reviveTicket: 0, startShield: 0 } }, []);
    }

    public setMenu(save: HudSaveView, skins: SkinView[]): void {
        this.showOnly('menu');
        this.updateSaveView(save, skins);
    }

    public setSettings(settings: SettingsView): void {
        this.setLanguage(settings.language);
        this.showOnly('settings');
        this.updateSettings(settings);
    }

    public setUpgrade(save: HudSaveView, skins: SkinView[], costs: Record<keyof PowerState, number>, consumables: ConsumableShopView[] = [], tab: ShopTab = 'buy'): void {
        this.showOnly('upgrade');
        this.setShopTab(tab);
        this.updateSaveView(save, skins);
        for (const item of consumables) {
            const label = this.consumableLabels[item.id];
            if (label) {
                label.string = `${item.label} x${item.count}\n${item.description}  ${item.cost}`;
            }
        }
        for (const kind of Object.keys(POWER_NAMES) as Array<keyof PowerState>) {
            const label = this.upgradeLabels[kind];
            if (label) {
                label.string = `${POWER_NAMES_I18N[this.language][kind]} Lv.${save.upgrades[kind]}  ${costs[kind]}`;
            }
        }
    }

    public setPlaying(): void {
        this.showOnly('game');
    }

    public setActiveItem(frame: SpriteFrame | null): void {
        this.setNodeVisible(this.activeItemNode, !!frame);
        if (this.activeItemIcon && frame) {
            this.activeItemIcon.spriteFrame = frame;
        }
    }

    public setPause(): void {
        this.showOnly('pause');
    }

    public setRevive(): void {
        this.showOnly('revive');
        this.setReviveAdProgress(false);
    }

    public setGameOver(result: GameOverView): void {
        this.showOnly('result');
        if (this.resultPanel) {
            Tween.stopAllByTarget(this.resultPanel);
            this.resultPanel.setScale(0.96, 0.96, 1);
            tween(this.resultPanel).to(0.2, { scale: new Vec3(1, 1, 1) }).start();
        }
        if (this.resultScoreLabel) this.resultScoreLabel.string = String(result.score);
        if (this.resultCoinLabel) this.resultCoinLabel.string = String(result.runCoins);
        if (this.resultDistanceLabel) this.resultDistanceLabel.string = `${Math.floor(result.distance)}m`;
        if (this.resultRewardLabel) this.resultRewardLabel.string = String(result.bestScore);
        if (this.resultMissionLabel) {
            const completedMissions = result.missions.filter((mission) => mission.completed);
            if (completedMissions.length > 0) {
                const missionSummary = completedMissions.map((mission) => `${mission.label}+${mission.reward}`).join('  ');
                this.resultMissionLabel.string = `${this.pick('\u4efb\u52a1\u5956\u52b1', 'Mission Rewards')}  ${missionSummary}`;
                this.setNodeVisible(this.resultMissionLabel.node, true);
            } else {
                this.resultMissionLabel.string = '';
                this.setNodeVisible(this.resultMissionLabel.node, false);
            }
        }
        if (this.resultAchievementLabel) {
            if (result.achievements.length > 0) {
                const achievementSummary = result.achievements.map((achievement) => `${achievement.label}+${achievement.reward}`).join('  ');
                this.resultAchievementLabel.string = `${this.pick('\u65b0\u6210\u5c31', 'New Achievements')}  ${achievementSummary}`;
                this.setNodeVisible(this.resultAchievementLabel.node, true);
            } else {
                this.resultAchievementLabel.string = '';
                this.setNodeVisible(this.resultAchievementLabel.node, false);
            }
        }
        if (this.totalCoinLabel) this.totalCoinLabel.string = String(result.totalCoins);
    }

    public setLeaderboard(entries: LeaderboardEntryView[]): void {
        this.setNodeVisible(this.overlayRoot, true);
        this.setNodeVisible(this.leaderboardShade, true);
        this.setNodeVisible(this.leaderboardPanel, true);
        const hasEntries = entries.length > 0;
        this.setNodeVisible(this.leaderboardEmptyLabel?.node, !hasEntries);
        for (let i = 0; i < this.leaderboardRows.length; i++) {
            const entry = entries[i];
            const row = this.leaderboardRows[i];
            const visible = entry !== undefined;
            this.setNodeVisible(row.bg.node, visible);
            this.setNodeVisible(row.line.node, visible);
            this.setNodeVisible(row.rank.node, visible);
            this.setNodeVisible(row.score.node, visible);
            this.setNodeVisible(row.distance.node, visible);
            this.setNodeVisible(row.coins.node, visible);
            if (!entry) {
                continue;
            }
            const isCurrent = entry.isCurrent === true;
            const color = this.leaderboardTextColor(i, isCurrent);
            this.drawLeaderboardRowBg(row.bg, i % 2 === 0, isCurrent);
            this.drawLeaderboardLine(row.line, 1, isCurrent ? new Color(216, 128, 45, 150) : new Color(216, 156, 92, 80));
            row.rank.string = isCurrent ? `${this.pick('\u672c\u5c40', 'Run')} #${entry.rank}` : `${this.rankBadge(entry.rank)}#${entry.rank}`;
            row.score.string = this.language === 'zh' ? `${entry.score}\u5206` : `${entry.score}`;
            row.distance.string = `${Math.floor(entry.distance)}m`;
            row.coins.string = this.language === 'zh' ? `${entry.coins}\u91d1\u5e01` : `${entry.coins}`;
            row.rank.color = color;
            row.score.color = color;
            row.distance.color = color;
            row.coins.color = color;
        }
    }

    public setAchievements(save: HudSaveView, achievements: AchievementEntryView[]): void {
        this.showOnly('achievements');
        this.updateSaveView(save, []);
        for (let i = 0; i < this.achievementRows.length; i++) {
            const item = achievements[i];
            const row = this.achievementRows[i];
            row.root.active = !!item;
            if (!item) {
                continue;
            }
            row.title.string = item.label;
            row.desc.string = item.description;
            row.reward.string = `${item.completed ? '\u2605' : '\u2606'} +${item.stars}`;
            row.title.color = item.completed ? new Color(111, 64, 39, 255) : new Color(96, 92, 98, 255);
            row.reward.color = item.completed ? new Color(210, 132, 38, 255) : new Color(132, 136, 143, 255);
            this.drawAchievementRow(row.bg, item.completed);
        }
    }

    public closeLeaderboard(): void {
        this.setNodeVisible(this.leaderboardShade, false);
        this.setNodeVisible(this.leaderboardPanel, false);
    }

    public updateStats(stats: HudStats): void {
        const scoreText = String(Math.floor(stats.score));
        if (this.scoreLabel) this.scoreLabel.string = scoreText;
        if (this.scoreShadowLabel) this.scoreShadowLabel.string = scoreText;
        if (this.coinLabel) this.coinLabel.string = `${this.pick('\u91d1\u5e01', 'Coins')} ${stats.runCoins}`;
        const distanceText = `${Math.floor(stats.distance)}m`;
        if (this.distanceLabel) this.distanceLabel.string = distanceText;
        if (this.distanceShadowLabel) this.distanceShadowLabel.string = distanceText;
        if (this.multiplierLabel) this.multiplierLabel.string = `x${stats.multiplier.toFixed(2)}`;
        if (this.comboLabel) this.comboLabel.string = stats.combo > 0 ? `${this.pick('\u8fde\u51fb', 'Combo')} ${stats.combo}` : '';
    }

    public showAchievementNotice(achievement: AchievementView): void {
        if (!this.achievementNoticeNode || !this.achievementNoticeLabel) {
            return;
        }
        this.achievementNoticeLabel.string = `${this.pick('\u83b7\u5f97\u6210\u5c31', 'Achievement')}\n${achievement.label}  +${achievement.reward}`;
        if (this.achievementNoticeIcon && achievement.icon) {
            this.achievementNoticeIcon.spriteFrame = achievement.icon;
        }
        Tween.stopAllByTarget(this.achievementNoticeNode);
        this.achievementNoticeNode.active = true;
        this.achievementNoticeNode.setPosition(0, 384, 0);
        tween(this.achievementNoticeNode)
            .to(0.22, { position: new Vec3(0, 304, 0) })
            .delay(2.0)
            .to(0.22, { position: new Vec3(0, 384, 0) })
            .call(() => {
                if (this.achievementNoticeNode) {
                    this.achievementNoticeNode.active = false;
                }
            })
            .start();
    }

    public showMissionToast(label: string, reward: number): void {
        if (!this.missionToastNode || !this.missionToastLabel) {
            return;
        }
        this.missionToastLabel.string = `${this.pick('\u4efb\u52a1\u5b8c\u6210', 'Mission Done')}: ${label}  +${reward}`;
        Tween.stopAllByTarget(this.missionToastNode);
        this.missionToastNode.active = true;
        this.missionToastNode.setScale(0.92, 0.92, 1);
        this.missionToastNode.setPosition(0, 188, 0);
        tween(this.missionToastNode)
            .to(0.16, { scale: new Vec3(1, 1, 1), position: new Vec3(0, 204, 0) })
            .delay(1.35)
            .to(0.18, { scale: new Vec3(0.92, 0.92, 1), position: new Vec3(0, 226, 0) })
            .call(() => {
                if (this.missionToastNode) {
                    this.missionToastNode.active = false;
                }
            })
            .start();
    }

    public updateSettings(settings: SettingsView): void {
        this.setLanguage(settings.language);
        const text = this.settingsTexts();
        if (this.settingsLanguageValueLabel) this.settingsLanguageValueLabel.string = settings.language === 'zh' ? '\u4e2d\u6587' : 'English';
        if (this.settingsBgmValueLabel) this.settingsBgmValueLabel.string = this.formatPercent(settings.bgmVolume);
        if (this.settingsSfxValueLabel) this.settingsSfxValueLabel.string = this.formatPercent(settings.sfxVolume);
        if (this.settingsAssistValueLabel) this.settingsAssistValueLabel.string = settings.assistHints ? text.on : text.off;
    }

    public setReviveAdProgress(active: boolean, secondsLeft = 0): void {
        if (active) {
            const seconds = Math.max(1, Math.ceil(secondsLeft));
            if (this.reviveTextLabel) {
                this.reviveTextLabel.string = this.pick('\u6a21\u62df\u5e7f\u544a\u64ad\u653e\u4e2d\uff0c\u7ed3\u675f\u540e\u81ea\u52a8\u590d\u6d3b', 'Simulated ad is playing. Revive follows automatically.');
            }
            if (this.reviveAdLabel) {
                this.reviveAdLabel.string = `${this.pick('\u5e7f\u544a\u4e2d', 'Ad')} ${seconds}s`;
            }
            return;
        }
        if (this.reviveTextLabel) {
            this.reviveTextLabel.string = this.texts().reviveText;
        }
        if (this.reviveAdLabel) {
            this.reviveAdLabel.string = this.texts().revive;
        }
    }

    public updatePowers(powers: PowerState, maxPowers: PowerState): void {
        for (const kind of this.powerKinds) {
            const row = this.powerTimerRows[kind];
            if (!row) {
                continue;
            }
            const remaining = Math.max(0, powers[kind]);
            const max = Math.max(0.1, maxPowers[kind]);
            const active = remaining > 0.05;
            this.setNodeVisible(row.root, active);
            if (!active) {
                continue;
            }
            row.label.string = `${POWER_NAMES_I18N[this.language][kind]} ${remaining.toFixed(1)}s`;
            this.drawPowerTimer(row, Math.max(0, Math.min(1, remaining / max)), kind);
        }
    }

    public getStartNode(): Node | null { return this.startNode; }
    public getCasualNode(): Node | null { return this.casualNode; }
    public getSettingsNode(): Node | null { return this.settingsNode; }
    public getUpgradeNode(): Node | null { return this.upgradeNode; }
    public getLeaderboardNode(): Node | null { return this.leaderboardNode; }
    public getAchievementsNode(): Node | null { return this.achievementsNode; }
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
    public getAchievementsBackNode(): Node | null { return this.achievementsBackNode; }
    public getReviveAdNode(): Node | null { return this.reviveAdNode; }
    public getReviveGiveUpNode(): Node | null { return this.reviveGiveUpNode; }
    public getSettingsLanguageNode(): Node | null { return this.settingsLanguageNode; }
    public getSettingsBgmMinusNode(): Node | null { return this.settingsBgmMinusNode; }
    public getSettingsBgmPlusNode(): Node | null { return this.settingsBgmPlusNode; }
    public getSettingsSfxMinusNode(): Node | null { return this.settingsSfxMinusNode; }
    public getSettingsSfxPlusNode(): Node | null { return this.settingsSfxPlusNode; }
    public getSettingsAssistNode(): Node | null { return this.settingsAssistNode; }
    public getSettingsResetSaveNode(): Node | null { return this.settingsResetSaveNode; }
    public getSettingsResetRankNode(): Node | null { return this.settingsResetRankNode; }
    public getUpgradeButton(kind: keyof PowerState): Node | null { return this.upgradeButtons[kind] ?? null; }
    public getConsumableButton(kind: ConsumableKind): Node | null { return this.consumableButtons[kind] ?? null; }
    public getShopTabNode(tab: ShopTab): Node | null { return this.shopTabNodes[tab] ?? null; }
    public getSkinButton(id: string): Node | null { return this.skinButtons[id] ?? null; }
    public getActiveItemNode(): Node | null { return this.activeItemNode; }

    private buildCurrency(_panelFrame: SpriteFrame | null, icons: HudIconFrames): void {
        if (!this.currencyRoot) return;
        const diamond = this.makeCurrencyPill('DiamondCurrency', new Vec3(292, 318, 0), icons.diamond, new Color(75, 104, 172, 255));
        this.diamondLabel = diamond.label;
        const star = this.makeCurrencyPill('StarCurrency', new Vec3(426, 318, 0), icons.achievementStar, new Color(190, 115, 54, 255));
        this.totalStarLabel = star.label;
        const coin = this.makeCurrencyPill('CoinCurrency', new Vec3(560, 318, 0), icons.coin, new Color(157, 97, 24, 255));
        this.totalCoinLabel = coin.label;
    }

    private buildMenu(buttonFrame: SpriteFrame | null, logoFrame: SpriteFrame | null, icons: HudIconFrames): void {
        if (!this.menuRoot) return;
        this.makeImage('MainLogo', logoFrame, new Vec3(0, 140, 0), 430, 238, this.menuRoot);
        const bestInfo = this.makeImage('MenuBestInfo', icons.menuBestPanel, new Vec3(0, -74, 0), 840, 182, this.menuRoot);
        this.menuBestTodayLabel = this.makeLabel('MenuBestToday', '0', 34, new Vec3(-204, -26, 0), new Color(119, 55, 23, 255), 260, bestInfo);
        this.menuBestAllLabel = this.makeLabel('MenuBestAll', '0', 34, new Vec3(234, -26, 0), new Color(119, 55, 23, 255), 260, bestInfo);
        this.menuBestTodayLabel.isBold = true;
        this.menuBestAllLabel.isBold = true;
        this.startNode = this.makeButton('StartButton', buttonFrame, new Vec3(-290, -196, 0), TXT.start, this.menuRoot, 150, 50, 19).node;
        this.casualNode = this.makeButton('CasualButton', buttonFrame, new Vec3(-96, -196, 0), '\u4f11\u95f2\u6a21\u5f0f', this.menuRoot, 150, 50, 19).node;
        this.upgradeNode = this.makeButton('ShopButton', buttonFrame, new Vec3(98, -196, 0), TXT.shop, this.menuRoot, 150, 50, 19).node;
        this.achievementsNode = this.makeButton('AchievementsButton', buttonFrame, new Vec3(292, -196, 0), TXT.achievements, this.menuRoot, 150, 50, 19).node;
        this.leaderboardNode = this.makeButton('LeaderboardButton', buttonFrame, new Vec3(-104, -258, 0), TXT.rank, this.menuRoot, 150, 50, 19).node;
        this.settingsNode = this.makeButton('SettingsButton', buttonFrame, new Vec3(104, -258, 0), TXT.settings, this.menuRoot, 150, 50, 19).node;
    }

    private buildGameHud(icons: HudIconFrames): void {
        if (!this.gameHudRoot) return;
        const statsPanel = this.makeImage('HudStatsPanel', icons.hudStatsPanel, new Vec3(-420, 260, 0), 326, 150, this.gameHudRoot);
        this.scoreShadowLabel = this.makeLabel('ScoreShadowLabel', '0', 27, new Vec3(84, 34, 0), new Color(255, 244, 214, 210), 130, statsPanel);
        this.scoreLabel = this.makeLabel('ScoreLabel', '0', 27, new Vec3(82, 37, 0), new Color(113, 55, 25, 255), 130, statsPanel);
        this.scoreShadowLabel.isBold = true;
        this.scoreLabel.isBold = true;
        this.scoreShadowLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.scoreLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.distanceShadowLabel = this.makeLabel('DistanceShadowLabel', '0m', 27, new Vec3(84, -35, 0), new Color(255, 244, 214, 210), 130, statsPanel);
        this.distanceLabel = this.makeLabel('DistanceLabel', '0m', 27, new Vec3(82, -32, 0), new Color(113, 55, 25, 255), 130, statsPanel);
        this.distanceShadowLabel.isBold = true;
        this.distanceLabel.isBold = true;
        this.distanceShadowLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.distanceLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.pauseNode = this.makeImage('PauseButton', icons.pause, new Vec3(596, 320, 0), 34, 34, this.gameHudRoot);
        this.comboLabel = this.makeLabel('ComboLabel', '', 23, new Vec3(0, 226, 0), new Color(255, 152, 84, 255), 260, this.gameHudRoot);
        this.buildActiveItemButton(icons);
        this.buildPowerTimers(icons);
    }

    private buildActiveItemButton(icons: HudIconFrames): void {
        if (!this.gameHudRoot) return;
        const root = this.makeNode('ActiveItemButton', this.gameHudRoot, new Vec3(566, 108, 0));
        root.addComponent(UITransform).setContentSize(92, 92);
        this.makeImage('ActiveItemButtonBase', icons.activeItemBase, Vec3.ZERO, 92, 92, root);
        const iconNode = this.makeImage('ActiveItemButtonIcon', icons.magnet, new Vec3(0, 2, 0), 58, 58, root);
        this.activeItemIcon = iconNode.getComponent(Sprite);
        root.active = false;
        this.activeItemNode = root;
    }

    private buildPowerTimers(icons: HudIconFrames): void {
        if (!this.gameHudRoot) return;
        const frames: Record<keyof PowerState, SpriteFrame> = {
            magnet: icons.magnet,
            shield: icons.shield,
            score: icons.scoreStar,
            dash: icons.dash,
        };
        for (let i = 0; i < this.powerKinds.length; i++) {
            const kind = this.powerKinds[i];
            const root = this.makeNode(`PowerTimer_${kind}`, this.gameHudRoot, new Vec3(460, 248 - i * 39, 0));
            root.addComponent(UITransform).setContentSize(250, 32);
            const bg = root.addComponent(Graphics);
            bg.fillColor = new Color(255, 248, 220, 210);
            bg.strokeColor = new Color(183, 118, 57, 180);
            bg.lineWidth = 2;
            bg.roundRect(-125, -16, 250, 32, 16);
            bg.fill();
            bg.stroke();
            const fillNode = this.makeNode(`PowerTimerFill_${kind}`, root, Vec3.ZERO);
            const fill = fillNode.addComponent(Graphics);
            this.makeImage(`PowerTimerIcon_${kind}`, frames[kind], new Vec3(-102, 0, 0), 28, 28, root);
            const label = this.makeLabel(`PowerTimerLabel_${kind}`, '', 17, new Vec3(24, 0, 0), new Color(93, 63, 45, 255), 174, root);
            label.horizontalAlign = Label.HorizontalAlign.LEFT;
            label.enableWrapText = false;
            label.isBold = true;
            this.powerTimerRows[kind] = { root, fill, label };
            root.active = false;
        }
    }

    private buildAchievementNotice(starFrame: SpriteFrame): void {
        const node = this.makeNode('AchievementNotice', this.node, new Vec3(0, 384, 0));
        node.addComponent(UITransform).setContentSize(760, 104);
        const bg = node.addComponent(Graphics);
        bg.fillColor = new Color(255, 246, 202, 238);
        bg.strokeColor = new Color(216, 132, 40, 235);
        bg.lineWidth = 4;
        bg.roundRect(-380, -52, 760, 104, 24);
        bg.fill();
        bg.stroke();
        const iconNode = this.makeImage('AchievementNoticeIcon', starFrame, new Vec3(-320, 0, 0), 72, 72, node);
        this.achievementNoticeIcon = iconNode.getComponent(Sprite);
        this.achievementNoticeLabel = this.makeLabel('AchievementNoticeText', '', 32, new Vec3(64, 0, 0), new Color(111, 64, 39, 255), 590, node);
        this.achievementNoticeLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.achievementNoticeLabel.verticalAlign = Label.VerticalAlign.CENTER;
        this.achievementNoticeLabel.lineHeight = 38;
        this.achievementNoticeLabel.overflow = Label.Overflow.CLAMP;
        this.achievementNoticeLabel.enableWrapText = true;
        const noticeTextTransform = this.achievementNoticeLabel.node.getComponent(UITransform);
        noticeTextTransform?.setContentSize(590, 88);
        this.achievementNoticeNode = node;
        node.active = false;
    }

    private buildMissionToast(): void {
        const node = this.makeNode('MissionToast', this.node, new Vec3(0, 204, 0));
        node.addComponent(UITransform).setContentSize(540, 58);
        const bg = node.addComponent(Graphics);
        bg.fillColor = new Color(255, 246, 202, 230);
        bg.strokeColor = new Color(216, 132, 40, 230);
        bg.lineWidth = 3;
        bg.roundRect(-270, -29, 540, 58, 20);
        bg.fill();
        bg.stroke();
        this.missionToastLabel = this.makeLabel('MissionToastText', '', 24, Vec3.ZERO, new Color(130, 78, 35, 255), 500, node);
        this.missionToastLabel.isBold = true;
        this.missionToastNode = node;
        node.active = false;
    }

    private buildSettings(buttonFrame: SpriteFrame | null, icons: HudIconFrames): void {
        if (!this.overlayRoot) return;
        this.settingsPanel = this.makeImage('SettingsPanel', icons.settingsPanel, new Vec3(0, 8, 0), 1038, 576, this.overlayRoot);

        const controlsBox = this.makeNode('SettingsControlsBox', this.settingsPanel, new Vec3(-252, 10, 0));
        const controlsTransform = controlsBox.addComponent(UITransform);
        controlsTransform.setContentSize(410, 318);
        const controlsBg = controlsBox.addComponent(Graphics);
        controlsBg.fillColor = new Color(255, 248, 220, 160);
        controlsBg.strokeColor = new Color(209, 138, 70, 126);
        controlsBg.lineWidth = 2;
        controlsBg.roundRect(-205, -159, 410, 318, 14);
        controlsBg.fill();
        controlsBg.stroke();
        this.makeLabel('SettingsControlsTitle', SETTINGS_TEXT.zh.controlsTitle, 30, new Vec3(0, 126, 0), new Color(111, 64, 39, 255), 340, controlsBox);
        const controls = this.makeLabel('SettingsControlsText', SETTINGS_TEXT.zh.controlsText, 25, new Vec3(0, -24, 0), new Color(88, 95, 101, 255), 370, controlsBox);
        controls.lineHeight = 34;
        controls.horizontalAlign = Label.HorizontalAlign.LEFT;
        controls.node.getComponent(UITransform)?.setContentSize(370, 238);

        this.makeLabel('SettingsLanguageTitle', SETTINGS_TEXT.zh.language, 22, new Vec3(98, 108, 0), new Color(92, 65, 62, 255), 180, this.settingsPanel);
        const languageButton = this.makeButton('SettingsLanguageButton', buttonFrame, new Vec3(308, 108, 0), '', this.settingsPanel, 170, 48, 19);
        this.settingsLanguageNode = languageButton.node;
        this.settingsLanguageValueLabel = languageButton.label;

        this.makeLabel('SettingsBgmTitle', SETTINGS_TEXT.zh.bgm, 22, new Vec3(94, 50, 0), new Color(92, 65, 62, 255), 170, this.settingsPanel);
        this.settingsBgmMinusNode = this.makeButton('SettingsBgmMinusButton', buttonFrame, new Vec3(236, 50, 0), '-', this.settingsPanel, 52, 42, 25).node;
        this.settingsBgmValueLabel = this.makeLabel('SettingsBgmValue', '65%', 21, new Vec3(306, 50, 0), new Color(74, 112, 143, 255), 76, this.settingsPanel);
        this.settingsBgmPlusNode = this.makeButton('SettingsBgmPlusButton', buttonFrame, new Vec3(376, 50, 0), '+', this.settingsPanel, 52, 42, 25).node;

        this.makeLabel('SettingsSfxTitle', SETTINGS_TEXT.zh.sfx, 22, new Vec3(94, -8, 0), new Color(92, 65, 62, 255), 170, this.settingsPanel);
        this.settingsSfxMinusNode = this.makeButton('SettingsSfxMinusButton', buttonFrame, new Vec3(236, -8, 0), '-', this.settingsPanel, 52, 42, 25).node;
        this.settingsSfxValueLabel = this.makeLabel('SettingsSfxValue', '80%', 21, new Vec3(306, -8, 0), new Color(74, 112, 143, 255), 76, this.settingsPanel);
        this.settingsSfxPlusNode = this.makeButton('SettingsSfxPlusButton', buttonFrame, new Vec3(376, -8, 0), '+', this.settingsPanel, 52, 42, 25).node;

        this.makeLabel('SettingsAssistTitle', SETTINGS_TEXT.zh.assist, 22, new Vec3(98, -70, 0), new Color(92, 65, 62, 255), 190, this.settingsPanel);
        const assistButton = this.makeButton('SettingsAssistButton', buttonFrame, new Vec3(308, -70, 0), SETTINGS_TEXT.zh.on, this.settingsPanel, 170, 48, 19);
        this.settingsAssistNode = assistButton.node;
        this.settingsAssistValueLabel = assistButton.label;

        this.makeLabel('SettingsDataTitle', SETTINGS_TEXT.zh.data, 22, new Vec3(94, -138, 0), new Color(92, 65, 62, 255), 170, this.settingsPanel);
        this.settingsResetSaveNode = this.makeButton('SettingsResetSaveButton', buttonFrame, new Vec3(240, -138, 0), SETTINGS_TEXT.zh.resetSave, this.settingsPanel, 150, 46, 18).node;
        this.settingsResetRankNode = this.makeButton('SettingsResetRankButton', buttonFrame, new Vec3(396, -138, 0), SETTINGS_TEXT.zh.resetRank, this.settingsPanel, 150, 46, 18).node;

        this.settingsBackNode = this.makeButton('SettingsBackButton', buttonFrame, new Vec3(0, -238, 0), TXT.back, this.settingsPanel, 190, 52, 21).node;
    }

    private buildPause(buttonFrame: SpriteFrame | null, icons: HudIconFrames): void {
        if (!this.overlayRoot) return;
        this.pausePanel = this.makeImage('PausePanel', icons.pausePanel, new Vec3(0, 10, 0), 682, 450, this.overlayRoot);
        this.continueNode = this.makeButton('ContinueButton', buttonFrame, new Vec3(-132, -116, 0), TXT.resume, this.pausePanel, 176, 54, 22).node;
        this.menuNode = this.makeButton('PauseMenuButton', buttonFrame, new Vec3(132, -116, 0), TXT.menu, this.pausePanel, 176, 54, 22).node;
    }

    private buildRevive(buttonFrame: SpriteFrame | null, panelFrame: SpriteFrame | null): void {
        if (!this.overlayRoot) return;
        this.revivePanel = this.makePanel('RevivePanel', panelFrame, new Vec3(0, 38, 0), 680, 300, this.overlayRoot);
        const reviveTitle = this.makeLabel('ReviveTitle', TXT.reviveTitle, 34, new Vec3(0, 92, 0), new Color(92, 65, 62, 255), 640, this.revivePanel);
        reviveTitle.enableWrapText = false;
        this.reviveTextLabel = this.makeLabel('ReviveText', TXT.reviveText, 22, new Vec3(0, 30, 0), new Color(88, 95, 101, 255), 560, this.revivePanel);
        const reviveAdButton = this.makeButton('ReviveAdButton', buttonFrame, new Vec3(-150, -82, 0), TXT.revive, this.revivePanel, 270, 58, 20);
        this.reviveAdNode = reviveAdButton.node;
        this.reviveAdLabel = reviveAdButton.label;
        this.reviveGiveUpNode = this.makeButton('ReviveGiveUpButton', buttonFrame, new Vec3(170, -82, 0), TXT.giveUp, this.revivePanel, 190, 58, 22).node;
    }

    private buildUpgrade(buttonFrame: SpriteFrame | null, panelFrame: SpriteFrame | null, icons: HudIconFrames): void {
        if (!this.overlayRoot) return;
        this.upgradePanel = this.makeImage('UpgradePanel', icons.shopPanel, new Vec3(0, 46, 0), 1050, 602, this.overlayRoot);

        const tabs: Array<{ tab: ShopTab; label: string; x: number }> = [
            { tab: 'buy', label: '\u8d2d\u4e70\u9053\u5177', x: -300 },
            { tab: 'upgrade', label: '\u9053\u5177\u5347\u7ea7', x: -100 },
            { tab: 'character', label: '\u89d2\u8272\u9009\u62e9', x: 100 },
            { tab: 'skin', label: '\u76ae\u80a4', x: 300 },
        ];
        for (const tab of tabs) {
            const button = this.makeButton(`ShopTab_${tab.tab}`, buttonFrame, new Vec3(tab.x, 150, 0), tab.label, this.upgradePanel, 168, 44, 17);
            this.shopTabNodes[tab.tab] = button.node;
            this.shopTabLabels[tab.tab] = button.label;
        }

        this.shopContentRoots.buy = this.makeNode('ShopBuyRoot', this.upgradePanel, Vec3.ZERO);
        this.shopContentRoots.upgrade = this.makeNode('ShopUpgradeRoot', this.upgradePanel, Vec3.ZERO);
        this.shopContentRoots.character = this.makeNode('ShopCharacterRoot', this.upgradePanel, Vec3.ZERO);
        this.shopContentRoots.skin = this.makeNode('ShopSkinRoot', this.upgradePanel, Vec3.ZERO);

        this.makeSectionTitle('ShopBuyTitle', '\u8d2d\u4e70\u9053\u5177', new Vec3(0, 90, 0), this.shopContentRoots.buy);
        const consumables: Array<{ id: ConsumableKind; frame: SpriteFrame; pos: Vec3 }> = [
            { id: 'startDash', frame: icons.dash, pos: new Vec3(0, 28, 0) },
            { id: 'reviveTicket', frame: icons.reviveTicket, pos: new Vec3(0, -42, 0) },
            { id: 'startShield', frame: icons.shield, pos: new Vec3(0, -112, 0) },
        ];
        for (const item of consumables) {
            const button = this.makeButton(`Consumable_${item.id}`, buttonFrame, item.pos, '', this.shopContentRoots.buy, 500, 58, 18);
            const iconAspect = item.id === 'reviveTicket' ? 1091 / 672 : undefined;
            this.makeFittedImage(`ConsumableIcon_${item.id}`, item.frame, new Vec3(-218, 0, 0), item.id === 'reviveTicket' ? 54 : 36, 36, button.node, iconAspect);
            button.label.node.setPosition(new Vec3(32, 0, 0));
            button.label.lineHeight = 22;
            button.label.getComponent(UITransform)?.setContentSize(400, 52);
            this.consumableButtons[item.id] = button.node;
            this.consumableLabels[item.id] = button.label;
        }

        this.makeSectionTitle('ShopUpgradeTitle', '\u9053\u5177\u5347\u7ea7', new Vec3(0, 90, 0), this.shopContentRoots.upgrade);
        const rows: Array<{ kind: keyof PowerState; frame: SpriteFrame; pos: Vec3 }> = [
            { kind: 'magnet', frame: icons.magnet, pos: new Vec3(-220, 24, 0) },
            { kind: 'shield', frame: icons.shield, pos: new Vec3(220, 24, 0) },
            { kind: 'score', frame: icons.scoreStar, pos: new Vec3(-220, -58, 0) },
            { kind: 'dash', frame: icons.dash, pos: new Vec3(220, -58, 0) },
        ];
        for (const row of rows) {
            const button = this.makeButton(`Upgrade_${row.kind}`, buttonFrame, row.pos, '', this.shopContentRoots.upgrade, 360, 58, 19);
            this.makeFittedImage(`UpgradeIcon_${row.kind}`, row.frame, new Vec3(-146, 0, 0), 30, 30, button.node);
            button.label.node.setPosition(new Vec3(30, 0, 0));
            button.label.getComponent(UITransform)?.setContentSize(250, 44);
            this.upgradeButtons[row.kind] = button.node;
            this.upgradeLabels[row.kind] = button.label;
        }

        this.makeSectionTitle('CharacterTitle', '\u89d2\u8272\u9009\u62e9', new Vec3(0, 90, 0), this.shopContentRoots.character);
        this.makeLabel('CharacterCurrent', '\u54c8\u57fa\u7c73', 30, new Vec3(0, 18, 0), new Color(111, 64, 39, 255), 360, this.shopContentRoots.character);
        this.makeLabel('CharacterHint', '\u5f53\u524d Demo \u6682\u65f6\u53ea\u6709\u54c8\u57fa\u7c73\u4e00\u4e2a\u89d2\u8272\uff0c\u540e\u7eed\u53ef\u6269\u5c55\u4e0d\u540c\u4e3b\u89d2\u3002', 20, new Vec3(0, -48, 0), new Color(74, 112, 143, 255), 620, this.shopContentRoots.character);

        this.makeSectionTitle('SkinTitle', '\u76ae\u80a4', new Vec3(0, 90, 0), this.shopContentRoots.skin);
        [
            { id: 'classic', label: '\u7ecf\u5178' },
            { id: 'berry', label: '\u8349\u8393\u751c\u5fc3' },
            { id: 'mint', label: '\u8584\u8377\u98de\u884c\u5458' },
        ].forEach((skin, index) => {
            const card = this.makeSkinCard(`Skin_${skin.id}`, new Vec3(-240 + index * 240, -36, 0), this.shopContentRoots.skin);
            const preview = this.makeImage(`Skin_${skin.id}_Preview`, null, new Vec3(0, 24, 0), 88, 88, card);
            const previewSprite = preview.getComponent(Sprite);
            const label = this.makeLabel(`Skin_${skin.id}_Label`, skin.label, 17, new Vec3(0, -46, 0), new Color(111, 64, 39, 255), 182, card);
            this.skinButtons[skin.id] = card;
            this.skinLabels[skin.id] = label;
            if (previewSprite) this.skinPreviewSprites[skin.id] = previewSprite;
        });
        this.upgradeBackNode = this.makeButton('UpgradeBackButton', buttonFrame, new Vec3(0, -246, 0), TXT.back, this.upgradePanel, 180, 48, 20).node;
        this.setShopTab('buy');
    }

    private buildResult(buttonFrame: SpriteFrame | null, icons: HudIconFrames): void {
        if (!this.overlayRoot) return;
        this.resultPanel = this.makeNode('ResultPanel', this.overlayRoot, Vec3.ZERO);
        this.resultPanel.addComponent(UITransform).setContentSize(1280, 720);
        this.resultBgNode = this.makeImage('ResultBackground', icons.resultBg, Vec3.ZERO, 1280, 720, this.resultPanel);
        this.makeImage('ResultBoard', icons.resultPanel, new Vec3(0, 18, 0), 660, 652, this.resultPanel);

        this.makeImage('ResultScoreRow', icons.resultScore, new Vec3(0, 150, 0), 500, 96, this.resultPanel);
        this.makeImage('ResultCoinRow', icons.resultCoin, new Vec3(0, 52, 0), 500, 74, this.resultPanel);
        this.makeImage('ResultDistanceRow', icons.resultDistance, new Vec3(0, -46, 0), 500, 72, this.resultPanel);
        this.makeImage('ResultBestRow', icons.resultBest, new Vec3(0, -146, 0), 500, 90, this.resultPanel);

        const valueColor = new Color(114, 52, 20, 255);
        this.resultScoreLabel = this.makeResultValueLabel('ResultScore', new Vec3(150, 150, 0), valueColor);
        this.resultCoinLabel = this.makeResultValueLabel('ResultCoin', new Vec3(150, 52, 0), valueColor);
        this.resultDistanceLabel = this.makeResultValueLabel('ResultDistance', new Vec3(150, -46, 0), valueColor);
        this.resultRewardLabel = this.makeResultValueLabel('ResultBest', new Vec3(150, -146, 0), valueColor);
        this.resultTitleLabel = this.makeLabel('ResultTitle', '', 1, new Vec3(0, 0, 0), valueColor, 1, this.resultPanel);
        this.resultMissionLabel = this.makeLabel('ResultMission', '', 18, new Vec3(0, -214, 0), new Color(158, 95, 44, 255), 560, this.resultPanel);
        this.resultAchievementLabel = this.makeLabel('ResultAchievement', '', 18, new Vec3(0, -246, 0), new Color(74, 112, 143, 255), 560, this.resultPanel);
        this.resultMissionLabel.enableWrapText = false;
        this.resultAchievementLabel.enableWrapText = false;
        this.resultMissionLabel.overflow = Label.Overflow.SHRINK;
        this.resultAchievementLabel.overflow = Label.Overflow.SHRINK;
        this.setNodeVisible(this.resultTitleLabel.node, false);
        this.setNodeVisible(this.resultMissionLabel.node, false);
        this.setNodeVisible(this.resultAchievementLabel.node, false);

        this.retryNode = this.makeButton('RetryButton', buttonFrame, new Vec3(-330, -306, 0), TXT.retry, this.resultPanel, 174, 56, 20).node;
        this.resultShopNode = this.makeButton('ResultShopButton', buttonFrame, new Vec3(-110, -306, 0), TXT.shop, this.resultPanel, 174, 56, 20).node;
        this.resultLeaderboardNode = this.makeButton('ResultLeaderboardButton', buttonFrame, new Vec3(110, -306, 0), TXT.rank, this.resultPanel, 174, 56, 20).node;
        this.resultMenuNode = this.makeButton('ResultMenuButton', buttonFrame, new Vec3(330, -306, 0), TXT.menu, this.resultPanel, 174, 56, 20).node;
    }

    private buildLeaderboard(buttonFrame: SpriteFrame | null, icons: HudIconFrames): void {
        if (!this.overlayRoot) return;
        this.leaderboardShade = this.makeNode('LeaderboardShade', this.overlayRoot, Vec3.ZERO);
        const shadeTransform = this.leaderboardShade.addComponent(UITransform);
        shadeTransform.setContentSize(1280, 720);
        const shade = this.leaderboardShade.addComponent(Graphics);
        shade.fillColor = new Color(41, 46, 58, 94);
        shade.rect(-640, -360, 1280, 720);
        shade.fill();
        this.leaderboardPanel = this.makeImage('LeaderboardPanel', icons.leaderboardPanel, new Vec3(0, 46, 0), 1050, 583, this.overlayRoot);
        this.makeLeaderboardHeader();
        this.leaderboardRows = [];
        for (let i = 0; i < 10; i++) {
            const y = 126 - i * 31;
            const color = i < 3 ? new Color(190, 115, 54, 255) : new Color(74, 112, 143, 255);
            const rowBg = this.makeLeaderboardRowBg(`LeaderboardRowBg_${i}`, y, i % 2 === 0);
            this.leaderboardRows.push({
                bg: rowBg.bg,
                line: rowBg.line,
                rank: this.makeLabel(`LeaderboardRank_${i}`, `#${i + 1}`, 18, new Vec3(-230, y, 0), color, 84, this.leaderboardPanel),
                score: this.makeLabel(`LeaderboardScore_${i}`, '--', 18, new Vec3(-78, y, 0), color, 144, this.leaderboardPanel),
                distance: this.makeLabel(`LeaderboardDistance_${i}`, '--', 18, new Vec3(78, y, 0), color, 120, this.leaderboardPanel),
                coins: this.makeLabel(`LeaderboardCoins_${i}`, '--', 18, new Vec3(224, y, 0), color, 138, this.leaderboardPanel),
            });
        }
        this.leaderboardEmptyLabel = this.makeLabel('LeaderboardEmpty', '\u8fd8\u6ca1\u6709\u6210\u7ee9\uff0c\u5148\u8dd1\u4e00\u5c40\u5427', 22, new Vec3(0, 22, 0), new Color(112, 112, 120, 220), 520, this.leaderboardPanel);
        this.setNodeVisible(this.leaderboardEmptyLabel.node, false);
        this.leaderboardBackNode = this.makeButton('LeaderboardBackButton', buttonFrame, new Vec3(0, -238, 0), TXT.back, this.leaderboardPanel, 190, 54, 21).node;
    }

    private buildAchievements(buttonFrame: SpriteFrame | null, icons: HudIconFrames, iconFrames: SpriteFrame[], starFrame: SpriteFrame): void {
        if (!this.overlayRoot) return;
        this.achievementsPanel = this.makeImage('AchievementsPanel', icons.achievementPanel, new Vec3(0, 6, 0), 1050, 582, this.overlayRoot);
        this.makeImage('AchievementsStarIcon', starFrame, new Vec3(-54, 176, 0), 30, 30, this.achievementsPanel);
        this.makeLabel('AchievementsStarTotal', '0', 21, new Vec3(24, 176, 0), new Color(190, 115, 54, 255), 180, this.achievementsPanel);
        const viewport = this.makeNode('AchievementsScrollView', this.achievementsPanel, new Vec3(0, -28, 0));
        viewport.addComponent(UITransform).setContentSize(790, 340);
        viewport.addComponent(Mask);
        const scroll = viewport.addComponent(ScrollView);
        scroll.horizontal = false;
        scroll.vertical = true;
        scroll.inertia = true;
        const content = this.makeNode('AchievementsContent', viewport, new Vec3(0, 0, 0));
        const rowGap = 92;
        const rowCount = Math.max(14, iconFrames.length);
        const contentHeight = rowCount * rowGap + 18;
        content.addComponent(UITransform).setContentSize(790, contentHeight);
        content.setPosition(0, contentHeight * 0.5 - 170, 0);
        scroll.content = content;
        this.achievementContent = content;
        this.achievementRows = [];
        for (let i = 0; i < rowCount; i++) {
            const y = contentHeight * 0.5 - 44 - i * rowGap;
            const rowRoot = this.makeNode(`AchievementCard_${i}`, content, new Vec3(0, y, 0));
            rowRoot.addComponent(UITransform).setContentSize(730, 78);
            const bg = rowRoot.addComponent(Graphics);
            this.drawAchievementRow(bg, false);
            const iconNode = this.makeImage(`AchievementIcon_${i}`, iconFrames[i] ?? null, new Vec3(-312, 0, 0), 58, 58, rowRoot);
            const icon = iconNode.getComponent(Sprite)!;
            const title = this.makeLabel(`AchievementTitle_${i}`, '', 21, new Vec3(-38, 15, 0), new Color(96, 92, 98, 255), 430, rowRoot);
            title.horizontalAlign = Label.HorizontalAlign.LEFT;
            title.isBold = true;
            title.node.getComponent(UITransform)?.setContentSize(430, 30);
            const desc = this.makeLabel(`AchievementDesc_${i}`, '', 16, new Vec3(-18, -16, 0), new Color(103, 112, 122, 255), 470, rowRoot);
            desc.horizontalAlign = Label.HorizontalAlign.LEFT;
            desc.node.getComponent(UITransform)?.setContentSize(470, 28);
            const reward = this.makeLabel(`AchievementReward_${i}`, '', 22, new Vec3(302, 0, 0), new Color(132, 136, 143, 255), 120, rowRoot);
            reward.isBold = true;
            this.achievementRows.push({ root: rowRoot, bg, icon, title, desc, reward });
        }
        this.achievementsBackNode = this.makeButton('AchievementsBackButton', buttonFrame, new Vec3(0, -244, 0), TXT.back, this.achievementsPanel, 180, 48, 20).node;
    }

    private drawAchievementRow(bg: Graphics, completed: boolean): void {
        bg.clear();
        bg.fillColor = completed ? new Color(255, 239, 174, 190) : new Color(255, 248, 220, 150);
        bg.strokeColor = completed ? new Color(210, 132, 38, 210) : new Color(209, 138, 70, 120);
        bg.lineWidth = completed ? 3 : 2;
        bg.roundRect(-365, -39, 730, 78, 12);
        bg.fill();
        bg.stroke();
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

    private makeLeaderboardRowBg(name: string, y: number, tinted: boolean): { bg: Graphics; line: Graphics } {
        if (!this.leaderboardPanel) {
            throw new Error('Leaderboard panel is not ready');
        }
        const node = this.makeNode(name, this.leaderboardPanel, new Vec3(0, y, 0));
        const transform = node.addComponent(UITransform);
        transform.setContentSize(570, 28);
        const bg = node.addComponent(Graphics);
        this.drawLeaderboardRowBg(bg, tinted, false);
        const line = this.makeLeaderboardLine(`${name}_Line`, y - 15, 1, new Color(216, 156, 92, 80));
        return { bg, line };
    }

    private makeLeaderboardLine(name: string, y: number, height: number, color: Color): Graphics {
        if (!this.leaderboardPanel) {
            throw new Error('Leaderboard panel is not ready');
        }
        const node = this.makeNode(name, this.leaderboardPanel, new Vec3(0, y, 0));
        const transform = node.addComponent(UITransform);
        transform.setContentSize(570, height);
        const line = node.addComponent(Graphics);
        this.drawLeaderboardLine(line, height, color);
        return line;
    }

    private drawLeaderboardRowBg(bg: Graphics, tinted: boolean, current: boolean): void {
        bg.clear();
        bg.fillColor = current
            ? new Color(255, 225, 118, 150)
            : tinted
                ? new Color(255, 238, 190, 70)
                : new Color(255, 255, 255, 30);
        bg.roundRect(-285, -14, 570, 28, 8);
        bg.fill();
    }

    private drawLeaderboardLine(line: Graphics, height: number, color: Color): void {
        line.clear();
        line.fillColor = color;
        line.rect(-285, -height * 0.5, 570, height);
        line.fill();
    }

    private leaderboardTextColor(index: number, current: boolean): Color {
        if (current) return new Color(111, 64, 39, 255);
        if (index === 0) return new Color(204, 117, 28, 255);
        if (index === 1) return new Color(123, 126, 142, 255);
        if (index === 2) return new Color(169, 107, 55, 255);
        return new Color(74, 112, 143, 255);
    }

    private rankBadge(rank: number): string {
        if (rank === 1) return '\u91d1 ';
        if (rank === 2) return '\u94f6 ';
        if (rank === 3) return '\u94dc ';
        return '';
    }

    private showOnly(mode: 'menu' | 'game' | 'settings' | 'upgrade' | 'achievements' | 'pause' | 'revive' | 'result'): void {
        this.setNodeVisible(this.menuRoot, mode === 'menu');
        this.setNodeVisible(this.gameHudRoot, mode === 'game' || mode === 'pause' || mode === 'revive');
        this.setNodeVisible(this.currencyRoot, mode === 'menu' || mode === 'upgrade' || mode === 'achievements' || mode === 'settings');
        this.setNodeVisible(this.overlayRoot, mode === 'settings' || mode === 'upgrade' || mode === 'achievements' || mode === 'pause' || mode === 'revive' || mode === 'result');
        this.setNodeVisible(this.settingsPanel, mode === 'settings');
        this.setNodeVisible(this.upgradePanel, mode === 'upgrade');
        this.setNodeVisible(this.achievementsPanel, mode === 'achievements');
        this.setNodeVisible(this.pausePanel, mode === 'pause');
        this.setNodeVisible(this.revivePanel, mode === 'revive');
        this.setNodeVisible(this.resultPanel, mode === 'result');
        this.setNodeVisible(this.leaderboardShade, false);
        this.setNodeVisible(this.leaderboardPanel, false);
    }

    private updateSaveView(save: HudSaveView, skins: SkinView[]): void {
        if (this.totalCoinLabel) this.totalCoinLabel.string = String(save.totalCoins);
        if (this.totalStarLabel) this.totalStarLabel.string = String(save.totalStars);
        this.setLabelString('AchievementsStarTotal', String(save.totalStars));
        if (this.menuBestTodayLabel) this.menuBestTodayLabel.string = String(save.bestScoreToday);
        if (this.menuBestAllLabel) this.menuBestAllLabel.string = String(save.bestScore);
        if (this.upgradeCoinLabel) this.upgradeCoinLabel.string = `${this.pick('\u91d1\u5e01', 'Coins')} ${save.totalCoins}    ${this.pick('\u661f\u661f', 'Stars')} ${save.totalStars}`;
        for (const skin of skins) {
            const label = this.skinLabels[skin.id];
            const node = this.skinButtons[skin.id];
            const preview = this.skinPreviewSprites[skin.id];
            const locked = !skin.unlocked;
            const canBuy = save.totalCoins >= skin.cost;
            if (label) {
                label.string = skin.selected
                    ? `${skin.shortLabel} \u2713`
                    : skin.unlocked
                        ? skin.shortLabel
                        : `${skin.shortLabel} ${skin.cost}`;
                label.color = locked && !canBuy ? new Color(132, 136, 143, 255) : new Color(111, 64, 39, 255);
            }
            if (preview) {
                preview.spriteFrame = skin.preview;
                preview.color = locked ? new Color(190, 198, 202, 255) : new Color(255, 255, 255, 255);
            }
            const bg = this.skinCardBgs[skin.id];
            if (bg) {
                this.drawSkinCard(bg, skin.selected, locked && !canBuy);
            }
        }
    }

    private setShopTab(tab: ShopTab): void {
        const labels: Record<ShopTab, string> = {
            buy: this.pick('\u8d2d\u4e70\u9053\u5177', 'Buy Items'),
            upgrade: this.pick('\u9053\u5177\u5347\u7ea7', 'Upgrades'),
            character: this.pick('\u89d2\u8272\u9009\u62e9', 'Character'),
            skin: this.pick('\u76ae\u80a4', 'Skins'),
        };
        for (const key of Object.keys(labels) as ShopTab[]) {
            const active = key === tab;
            this.setNodeVisible(this.shopContentRoots[key], active);
            const sprite = this.shopTabNodes[key]?.getComponent(Sprite);
            const label = this.shopTabLabels[key];
            if (sprite) {
                sprite.color = active ? new Color(255, 245, 184, 255) : new Color(255, 255, 255, 238);
            }
            if (label) {
                label.string = labels[key];
                label.color = active ? new Color(111, 64, 39, 255) : new Color(122, 101, 87, 255);
            }
        }
    }

    private setLanguage(language: Language): void {
        if (this.language === language) {
            return;
        }
        this.language = language;
        this.updateStaticText();
    }

    private texts(): TextMap {
        return TEXTS[this.language];
    }

    private settingsTexts(): SettingsTextMap {
        return SETTINGS_TEXT[this.language];
    }

    private pick(zh: string, en: string): string {
        return this.language === 'zh' ? zh : en;
    }

    private formatPercent(value: number): string {
        return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
    }

    private updateStaticText(): void {
        const text = this.texts();
        const settings = this.settingsTexts();
        this.setLabelString('StartButtonText', text.start);
        this.setLabelString('CasualButtonText', this.pick('\u4f11\u95f2\u6a21\u5f0f', 'Casual'));
        this.setLabelString('ShopButtonText', text.shop);
        this.setLabelString('AchievementsButtonText', text.achievements);
        this.setLabelString('LeaderboardButtonText', text.rank);
        this.setLabelString('SettingsButtonText', text.settings);
        this.setLabelString('SettingsTitle', text.settingsTitle);
        this.setLabelString('SettingsControlsTitle', settings.controlsTitle);
        this.setLabelString('SettingsControlsText', settings.controlsText);
        this.setLabelString('SettingsLanguageTitle', settings.language);
        this.setLabelString('SettingsBgmTitle', settings.bgm);
        this.setLabelString('SettingsSfxTitle', settings.sfx);
        this.setLabelString('SettingsAssistTitle', settings.assist);
        this.setLabelString('SettingsDataTitle', settings.data);
        this.setLabelString('SettingsResetSaveButtonText', settings.resetSave);
        this.setLabelString('SettingsResetRankButtonText', settings.resetRank);
        this.setLabelString('SettingsBackButtonText', text.back);
        this.setLabelString('PauseTitle', this.pick('\u6682\u505c\u4e2d', 'Paused'));
        this.setLabelString('ContinueButtonText', text.resume);
        this.setLabelString('PauseMenuButtonText', text.menu);
        this.setLabelString('ReviveTitle', text.reviveTitle);
        this.setLabelString('ReviveText', text.reviveText);
        this.setLabelString('ReviveAdButtonText', text.revive);
        this.setLabelString('ReviveGiveUpButtonText', text.giveUp);
        this.setLabelString('UpgradeTitle', text.shopTitle);
        this.setLabelString('ShopBuyTitle', this.pick('\u8d2d\u4e70\u9053\u5177', 'Buy Items'));
        this.setLabelString('ShopUpgradeTitle', this.pick('\u9053\u5177\u5347\u7ea7', 'Power Upgrades'));
        this.setLabelString('CharacterTitle', this.pick('\u89d2\u8272\u9009\u62e9', 'Character'));
        this.setLabelString('CharacterCurrent', this.pick('\u54c8\u57fa\u7c73', 'Hakimi'));
        this.setLabelString('CharacterHint', this.pick('\u5f53\u524d Demo \u6682\u65f6\u53ea\u6709\u54c8\u57fa\u7c73\u4e00\u4e2a\u89d2\u8272\uff0c\u540e\u7eed\u53ef\u6269\u5c55\u4e0d\u540c\u4e3b\u89d2\u3002', 'This demo currently has one hero. More playable characters can be added later.'));
        this.setLabelString('SkinTitle', this.pick('\u76ae\u80a4', 'Skins'));
        this.setLabelString('UpgradeBackButtonText', text.back);
        this.setLabelString('AchievementsTitle', text.achievementsTitle);
        this.setLabelString('AchievementsBackButtonText', text.back);
        this.setLabelString('RetryButtonText', text.retry);
        this.setLabelString('ResultShopButtonText', text.shop);
        this.setLabelString('ResultLeaderboardButtonText', text.rank);
        this.setLabelString('ResultMenuButtonText', text.menu);
        this.setLabelString('LeaderboardTitle', text.rankTitle);
        this.setLabelString('LeaderboardHeaderRank', this.pick('\u540d\u6b21', 'Rank'));
        this.setLabelString('LeaderboardHeaderScore', this.pick('\u5206\u6570', 'Score'));
        this.setLabelString('LeaderboardHeaderDistance', this.pick('\u91cc\u7a0b', 'Distance'));
        this.setLabelString('LeaderboardHeaderCoins', this.pick('\u91d1\u5e01', 'Coins'));
        this.setLabelString('LeaderboardEmpty', this.pick('\u8fd8\u6ca1\u6709\u6210\u7ee9\uff0c\u5148\u8dd1\u4e00\u5c40\u5427', 'No results yet. Try one run first.'));
        this.setLabelString('LeaderboardBackButtonText', text.back);
    }

    private setLabelString(name: string, value: string): void {
        const label = this.findNode(this.node, name)?.getComponent(Label);
        if (label) {
            label.string = value;
        }
    }

    private findNode(root: Node | null, name: string): Node | null {
        if (!root) {
            return null;
        }
        if (root.name === name) {
            return root;
        }
        for (const child of root.children) {
            const result = this.findNode(child, name);
            if (result) {
                return result;
            }
        }
        return null;
    }

    private drawPowerTimer(row: PowerTimerRow, ratio: number, kind: keyof PowerState): void {
        row.fill.clear();
        const width = 196 * ratio;
        row.fill.fillColor = this.powerTimerColor(kind);
        row.fill.roundRect(-86, -9, width, 18, 9);
        row.fill.fill();
    }

    private powerTimerColor(kind: keyof PowerState): Color {
        if (kind === 'magnet') return new Color(100, 188, 238, 148);
        if (kind === 'shield') return new Color(94, 146, 238, 148);
        if (kind === 'score') return new Color(255, 198, 72, 154);
        return new Color(174, 118, 238, 148);
    }

    private makeSectionTitle(name: string, text: string, pos: Vec3, parent: Node): Label {
        const label = this.makeLabel(name, text, 22, pos, new Color(92, 65, 62, 255), 260, parent);
        label.isBold = true;
        return label;
    }

    private makeResultValueLabel(name: string, pos: Vec3, color: Color): Label {
        const label = this.makeLabel(name, '0', 34, pos, color, 250, this.resultPanel ?? this.node);
        label.isBold = true;
        label.enableWrapText = false;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.node.getComponent(UITransform)?.setContentSize(250, 52);
        return label;
    }

    private makeButton(name: string, frame: SpriteFrame | null, pos: Vec3, text: string, parent = this.node, width = 300, height = 90, fontSize = 30): { node: Node; label: Label } {
        const node = this.makeImage(name, frame, pos, width, height, parent);
        const label = this.makeLabel(`${name}Text`, text, fontSize, Vec3.ZERO, new Color(111, 64, 39, 255), width - 28, node);
        label.enableWrapText = false;
        return { node, label };
    }

    private makeSkinCard(name: string, pos: Vec3, parent: Node): Node {
        const node = this.makeNode(name, parent, pos);
        node.addComponent(UITransform).setContentSize(204, 132);
        const bg = node.addComponent(Graphics);
        this.drawSkinCard(bg, false, false);
        this.skinCardBgs[name.replace('Skin_', '')] = bg;
        return node;
    }

    private drawSkinCard(bg: Graphics, selected: boolean, disabled: boolean): void {
        bg.clear();
        bg.fillColor = selected
            ? new Color(255, 243, 186, 54)
            : new Color(229, 255, 251, 42);
        bg.strokeColor = selected
            ? new Color(237, 137, 47, 245)
            : disabled
                ? new Color(142, 154, 162, 205)
                : new Color(80, 171, 185, 235);
        bg.lineWidth = selected ? 6 : 4;
        bg.roundRect(-102, -66, 204, 132, 18);
        bg.fill();
        bg.stroke();
        bg.strokeColor = selected
            ? new Color(255, 224, 111, 165)
            : new Color(255, 255, 255, 128);
        bg.lineWidth = 2;
        bg.roundRect(-92, -56, 184, 112, 14);
        bg.stroke();
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

    private makeFittedImage(name: string, frame: SpriteFrame | null, pos: Vec3, maxWidth: number, maxHeight: number, parent = this.node, aspectRatio?: number): Node {
        const node = new Node(name);
        parent.addChild(node);
        node.setPosition(pos);
        const transform = node.addComponent(UITransform);
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        if (!frame) {
            transform.setContentSize(maxWidth, maxHeight);
            return node;
        }

        sprite.spriteFrame = frame;
        const size = aspectRatio && aspectRatio > 0
            ? this.sizeForAspectRatio(maxWidth, maxHeight, aspectRatio)
            : this.spriteFrameSize(frame);
        const scale = Math.min(maxWidth / size.width, maxHeight / size.height);
        transform.setContentSize(size.width * scale, size.height * scale);
        return node;
    }

    private sizeForAspectRatio(maxWidth: number, maxHeight: number, aspectRatio: number): { width: number; height: number } {
        if (maxWidth / maxHeight > aspectRatio) {
            return { width: maxHeight * aspectRatio, height: maxHeight };
        }
        return { width: maxWidth, height: maxWidth / aspectRatio };
    }

    private spriteFrameSize(frame: SpriteFrame): { width: number; height: number } {
        const anyFrame = frame as unknown as {
            originalSize?: { width: number; height: number };
            rect?: { width: number; height: number };
            width?: number;
            height?: number;
            getOriginalSize?: () => { width: number; height: number };
        };
        const size = anyFrame.originalSize ?? anyFrame.getOriginalSize?.() ?? anyFrame.rect;
        const width = Number(size?.width ?? anyFrame.width ?? 1);
        const height = Number(size?.height ?? anyFrame.height ?? 1);
        return {
            width: Math.max(1, width),
            height: Math.max(1, height),
        };
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
