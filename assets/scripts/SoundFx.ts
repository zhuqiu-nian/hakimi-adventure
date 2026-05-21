import { _decorator, AudioClip, Component, director, resources } from 'cc';

const { ccclass, property } = _decorator;

/**
 * SoundFx - 音效触发组件
 * 挂载在任何需要播放音效的对象上，在适当时候调用 play() 即可。
 *
 * 使用方式（代码）：
 *   this.getComponent(SoundFx)?.play('jump');
 *   this.getComponent(SoundFx)?.play('coin');
 */
@ccclass('SoundFx')
export class SoundFx extends Component {
    @property
    public audioManagerNode: string = 'AudioManager';

    /** 触发时播放的音效 key（可动态修改） */
    @property
    public sfxKey: string = '';

    /** 是否在 start 时自动播放 */
    @property
    public playOnStart = false;

    /** preload 的音效 key 列表（提前加载到缓存） */
    @property
    public preloadKeys: string[] = [];

    private _clip: AudioClip | null = null;
    private _loaded = false;

    start(): void {
        if (this.playOnStart && this.sfxKey) {
            this.play(this.sfxKey);
        }
    }

    /**
     * 播放指定的音效 key（异步加载后播放，支持多 clip 自动轮询）
     */
    play(key?: string): void {
        const targetKey = key ?? this.sfxKey;
        if (!targetKey) return;

        const manager = this._findManager();
        if (!manager) return;

        // 优先尝试直接路径（sfxKey 本身就是个 resources 路径）
        if (targetKey.startsWith('audio/sfx/') || targetKey.endsWith('.clip')) {
            resources.load(targetKey, AudioClip, (err, clip) => {
                if (err || !clip) return;
                manager.playSfxDirect(clip);
            });
            return;
        }

        // 否则视为 key，从 manager 播放
        manager.playSfx(targetKey);
    }

    /**
     * 加载音效但不播放（用于预加载）
     */
    preload(key: string): void {
        if (!key) return;
        resources.load(key, AudioClip, (err, clip) => {
            if (err || !clip) return;
            this._clip = clip;
            this._loaded = true;
        });
    }

    private _findManager(): import('./AudioManager').AudioManager | null {
        const node = director.getScene()?.getChildByName(this.audioManagerNode);
        return node?.getComponent('AudioManager') as import('./AudioManager').AudioManager ?? null;
    }
}
