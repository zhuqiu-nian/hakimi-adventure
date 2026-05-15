import { _decorator, AudioClip, AudioSource, Component, resources } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    @property(AudioSource)
    public bgmSource: AudioSource | null = null;

    @property(AudioSource)
    public sfxSource: AudioSource | null = null;

    @property({ range: [0, 1], slide: true })
    public bgmVolume = 0.65;

    @property({ range: [0, 1], slide: true })
    public sfxVolume = 0.8;

    private _loadedClips: Map<string, AudioClip> = new Map();

    onLoad(): void {
        // Auto-wiring: AudioManager is scene-root child; GameRoot is under Canvas.
        // Path: AudioManager → Scene → Canvas → GameRoot
        const scene = this.node.parent;
        const canvas = scene?.getChildByName('Canvas');
        const gameRoot = canvas?.getChildByName('GameRoot');
        const gameManager = gameRoot?.getComponent('GameManager') as any;
        if (gameManager) {
            gameManager.audioManager = this;
        }

        // Always auto-detect AudioSource components on this node (ignore editor bindings)
        const sources = this.getComponents(AudioSource);
        this.bgmSource = sources[0] ?? null;
        this.sfxSource = sources[1] ?? null;

        console.log('[AudioManager] onLoad — sources:', sources.length, 'bgm:', !!this.bgmSource, 'sfx:', !!this.sfxSource);

        if (this.bgmSource) {
            this.bgmSource.volume = this.bgmVolume;
            this.bgmSource.loop = true;
        }
        if (this.sfxSource) {
            this.sfxSource.volume = this.sfxVolume;
        }
    }

    playBgm(path: string): void {
        if (!this.bgmSource) return;
        resources.load(path, AudioClip, (err, clip) => {
            if (err || !clip) return;
            this.bgmSource!.clip = clip;
            this.bgmSource!.play();
        });
    }

    stopBgm(): void {
        this.bgmSource?.stop();
    }

    pauseBgm(): void {
        this.bgmSource?.pause();
    }

    resumeBgm(): void {
        this.bgmSource?.resume();
    }

    playSfx(key: string): void {
        console.log('[AudioManager] playSfx called:', key, 'sfxSource:', !!this.sfxSource);
        if (!this.sfxSource) return;
        if (key === 'dodge') return; // 无独立音效文件

        const path = `audio/sfx/${key}`;

        if (this._loadedClips.has(key)) {
            this.sfxSource.playOneShot(this._loadedClips.get(key)!);
            return;
        }

        resources.load(path, AudioClip, (err, clip) => {
            console.log('[AudioManager] loaded:', key, 'clip:', !!clip, 'err:', err);
            if (err || !clip) return;
            this._loadedClips.set(key, clip);
            this.sfxSource!.playOneShot(clip);
        });
    }

    playSfxDirect(clip: AudioClip): void {
        this.sfxSource?.playOneShot(clip);
    }

    setBgmVolume(vol: number): void {
        this.bgmVolume = Math.max(0, Math.min(1, vol));
        if (this.bgmSource) this.bgmSource.volume = this.bgmVolume;
    }

    setSfxVolume(vol: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, vol));
        if (this.sfxSource) this.sfxSource.volume = this.sfxVolume;
    }
}