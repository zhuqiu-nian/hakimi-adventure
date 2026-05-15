import { _decorator, Component, Sprite, SpriteFrame, Vec3 } from 'cc';
import { AudioManager } from './AudioManager';

const { ccclass, property } = _decorator;

@ccclass('RunnerController')
export class RunnerController extends Component {
    @property
    public groundY = -178;

    @property
    public jumpVelocity = 1160;

    @property
    public doubleJumpVelocity = 1040;

    @property
    public gravity = -2700;

    @property
    public slideDuration = 0.45;

    @property
    public glideGravityScale = 0.38;

    @property
    public runFrameDuration = 0.04;

    @property
    public actionFrameDuration = 0.045;

    public isSliding = false;
    public isAirborne = false;
    public isGliding = false;

    private velocityY = 0;
    private jumpCount = 0;
    private readonly baseScale = new Vec3(1, 1, 1);
    private slideTimer = 0;
    private slideHeld = false;
    private slideRecovering = false;
    private animTimer = 0;
    private frameIndex = 0;
    private actionTimer = 0;
    private landingTimer = -1;
    private specialTimer = 0;
    private specialFrame: SpriteFrame | null = null;
    private sprite: Sprite | null = null;
    private runFrames: SpriteFrame[] = [];
    private jumpFrames: SpriteFrame[] = [];
    private slideFrames: SpriteFrame[] = [];
    private slideRecoveryFrames: SpriteFrame[] = [];
    private fallFrame: SpriteFrame | null = null;
    private glideFrames: SpriteFrame[] = [];
    private jumpLandingFrames: SpriteFrame[] = [];
    private glideLandingFrames: SpriteFrame[] = [];
    private landingFrames: SpriteFrame[] = [];
    private audioManager: AudioManager | null = null;

    public setupAnimation(
        sprite: Sprite,
        runFrames: SpriteFrame[],
        jumpFrames: SpriteFrame[],
        slideFrames: SpriteFrame | SpriteFrame[],
        fallFrame?: SpriteFrame,
        glideFrames?: SpriteFrame | SpriteFrame[],
        audioManager?: AudioManager | null,
    ): void {
        this.sprite = sprite;
        this.runFrames = runFrames;
        this.jumpFrames = jumpFrames;
        const slideList = Array.isArray(slideFrames) ? slideFrames : [slideFrames];
        const slideRecoverStart = Math.max(1, Math.floor(slideList.length * 0.62));
        this.slideFrames = slideList.slice(0, slideRecoverStart);
        this.slideRecoveryFrames = slideList.slice(slideRecoverStart);
        this.fallFrame = fallFrame ?? jumpFrames[Math.floor(jumpFrames.length * 0.65)] ?? jumpFrames[0] ?? null;
        const glideList = Array.isArray(glideFrames) ? glideFrames : (glideFrames ? [glideFrames] : [this.fallFrame].filter((frame): frame is SpriteFrame => !!frame));
        this.glideFrames = glideList;
        this.jumpLandingFrames = jumpFrames.slice(Math.max(0, jumpFrames.length - 6));
        this.glideLandingFrames = glideList.slice(Math.max(0, glideList.length - 6));
        this.audioManager = audioManager ?? null;
        this.setFrame(this.runFrames[0]);
    }

    public reset(startX: number): void {
        this.velocityY = 0;
        this.jumpCount = 0;
        this.isSliding = false;
        this.isAirborne = false;
        this.isGliding = false;
        this.slideTimer = 0;
        this.slideHeld = false;
        this.slideRecovering = false;
        this.animTimer = 0;
        this.actionTimer = 0;
        this.landingTimer = -1;
        this.specialTimer = 0;
        this.specialFrame = null;
        this.frameIndex = 0;
        this.node.setPosition(startX, this.groundY, 0);
        this.node.setScale(this.baseScale);
        this.node.angle = 0;
        this.setFrame(this.runFrames[0]);
    }

    public jump(): boolean {
        if (this.isSliding || this.slideRecovering) {
            return false;
        }

        if (this.jumpCount === 0) {
            this.velocityY = this.jumpVelocity;
            this.jumpCount = 1;
            this.actionTimer = 0;
            this.isAirborne = true;
            this.setFrame(this.jumpFrames[0]);
            this.audioManager?.playSfx('jump');
            return true;
        }

        if (this.jumpCount === 1) {
            this.velocityY = this.doubleJumpVelocity;
            this.jumpCount = 2;
            this.actionTimer = 0;
            this.isAirborne = true;
            this.setFrame(this.jumpFrames[1] ?? this.jumpFrames[0]);
            this.audioManager?.playSfx('jump');
            return true;
        }

        return false;
    }

    public startGlide(): boolean {
        if (!this.isAirborne || this.isSliding) {
            return false;
        }
        if (!this.isGliding) {
            this.actionTimer = 0;
        }
        this.isGliding = true;
        this.setFrame(this.glideFrames[0]);
        return true;
    }

    public stopGlide(): void {
        this.isGliding = false;
    }

    public playSpecial(frame: SpriteFrame | null | undefined, duration = 0.36): void {
        if (!frame || this.isSliding || this.slideRecovering) {
            return;
        }
        this.specialFrame = frame;
        this.specialTimer = duration;
        this.setFrame(frame);
    }

    public slide(hold = false): boolean {
        if (this.jumpCount > 0 || this.slideRecovering) {
            return false;
        }
        if (this.isSliding) {
            this.slideHeld = this.slideHeld || hold;
            return true;
        }

        this.isSliding = true;
        this.isGliding = false;
        this.slideHeld = hold;
        this.slideTimer = this.slideDuration;
        this.actionTimer = 0;
        this.node.setScale(this.baseScale);
        this.setFrame(this.slideFrames[0]);
        this.audioManager?.playSfx('slide');
        return true;
    }

    public stopSlide(): void {
        if (!this.isSliding || !this.slideHeld) {
            return;
        }
        this.isSliding = false;
        this.slideHeld = false;
        this.slideTimer = 0;
        this.actionTimer = 0;
        this.slideRecovering = this.slideRecoveryFrames.length > 0;
        this.node.setScale(this.baseScale);
        if (this.slideRecovering) {
            this.setFrame(this.slideRecoveryFrames[0]);
        }
    }

    public tick(dt: number, running: boolean): void {
        if (!running) {
            return;
        }

        if (this.isSliding) {
            if (this.slideHeld) {
                this.slideTimer = Math.max(this.slideTimer, 0.18);
            } else {
                this.slideTimer -= dt;
            }
            this.actionTimer += dt;
            if (!this.slideHeld && this.slideTimer <= 0) {
                this.beginSlideRecovery();
            }
        }

        const pos = this.node.position.clone();
        const wasAirborne = this.isAirborne;
        const wasGliding = this.isGliding;
        const gravityScale = this.isGliding && this.velocityY < 260 ? this.glideGravityScale : 1;
        this.velocityY += this.gravity * gravityScale * dt;
        if (this.isGliding && this.velocityY < -220) {
            this.velocityY = -220;
        }
        pos.y += this.velocityY * dt;

        if (pos.y <= this.groundY) {
            pos.y = this.groundY;
            this.velocityY = 0;
            this.jumpCount = 0;
            this.isAirborne = false;
            this.isGliding = false;
            if (wasAirborne) {
                this.beginLanding(wasGliding);
            }
        }

        this.node.setPosition(pos);

        if (this.slideRecovering) {
            this.actionTimer += dt;
            this.setFrame(this.pickFrameByTime(this.slideRecoveryFrames, this.actionTimer));
            if (this.isSequenceDone(this.slideRecoveryFrames, this.actionTimer)) {
                this.slideRecovering = false;
                this.actionTimer = 0;
            }
            this.node.angle = 0;
            return;
        }

        if (this.landingTimer >= 0) {
            this.landingTimer += dt;
            this.setFrame(this.pickFrameByTime(this.landingFrames, this.landingTimer));
            if (this.isSequenceDone(this.landingFrames, this.landingTimer)) {
                this.landingTimer = -1;
            }
            this.node.angle = 0;
            return;
        }

        if (this.specialTimer > 0 && !this.isSliding) {
            this.specialTimer -= dt;
            this.setFrame(this.specialFrame);
            return;
        }

        if (this.isSliding) {
            this.setFrame(this.pickSlideFrame(this.actionTimer));
            this.node.angle = 0;
        } else if (this.isGliding) {
            this.actionTimer += dt;
            this.setFrame(this.pickGlideFrame(this.actionTimer));
            this.node.angle = 5;
        } else if (this.jumpCount > 0) {
            this.actionTimer += dt;
            this.setFrame(this.pickJumpFrame(this.actionTimer));
            this.node.angle = Math.max(-10, Math.min(12, this.velocityY * 0.01));
        } else {
            this.tickRunAnimation(dt);
            this.node.angle = 0;
        }
    }

    private tickRunAnimation(dt: number): void {
        if (this.runFrames.length === 0) {
            return;
        }

        this.animTimer += dt;
        if (this.animTimer >= this.runFrameDuration) {
            this.animTimer = 0;
            this.frameIndex = (this.frameIndex + 1) % this.runFrames.length;
            this.setFrame(this.runFrames[this.frameIndex]);
        }
    }

    private beginSlideRecovery(): void {
        this.isSliding = false;
        this.slideHeld = false;
        this.slideTimer = 0;
        this.actionTimer = 0;
        this.slideRecovering = this.slideRecoveryFrames.length > 0;
        this.node.setScale(this.baseScale);
    }

    private beginLanding(fromGlide: boolean): void {
        this.landingFrames = fromGlide && this.glideLandingFrames.length > 0 ? this.glideLandingFrames : this.jumpLandingFrames;
        this.landingTimer = this.landingFrames.length > 0 ? 0 : -1;
    }

    private pickFrameByTime(frames: SpriteFrame[], elapsed: number): SpriteFrame | null {
        if (frames.length === 0) {
            return null;
        }
        const index = Math.min(frames.length - 1, Math.floor(elapsed / this.actionFrameDuration));
        return frames[index];
    }

    private isSequenceDone(frames: SpriteFrame[], elapsed: number): boolean {
        return frames.length === 0 || elapsed >= frames.length * this.actionFrameDuration;
    }

    private pickSlideFrame(elapsed: number): SpriteFrame | null {
        if (this.slideFrames.length === 0) {
            return null;
        }
        const enterCount = Math.min(6, this.slideFrames.length);
        if (elapsed < enterCount * this.actionFrameDuration) {
            return this.pickFrameByTime(this.slideFrames.slice(0, enterCount), elapsed);
        }
        const loopFrames = this.slideFrames.slice(Math.max(0, enterCount - 2));
        const loopIndex = Math.floor((elapsed - enterCount * this.actionFrameDuration) / this.actionFrameDuration) % loopFrames.length;
        return loopFrames[loopIndex] ?? this.slideFrames[this.slideFrames.length - 1];
    }

    private pickJumpFrame(elapsed: number): SpriteFrame | null {
        if (this.jumpFrames.length === 0) {
            return null;
        }
        const landingStart = Math.max(0, this.jumpFrames.length - this.jumpLandingFrames.length);
        const airFrames = this.jumpFrames.slice(0, landingStart);
        if (airFrames.length === 0) {
            return this.fallFrame ?? this.jumpFrames[0];
        }
        const riseEnd = Math.max(1, Math.floor(airFrames.length * 0.55));
        const rangeStart = this.velocityY > 120 ? 0 : riseEnd;
        const range = airFrames.slice(rangeStart);
        return this.pickFrameByTime(range.length > 0 ? range : airFrames, elapsed) ?? this.fallFrame ?? this.jumpFrames[0];
    }

    private pickGlideFrame(elapsed: number): SpriteFrame | null {
        if (this.glideFrames.length === 0) {
            return null;
        }
        const landingStart = Math.max(0, this.glideFrames.length - this.glideLandingFrames.length);
        const activeFrames = this.glideFrames.slice(0, landingStart);
        const openCount = Math.min(7, activeFrames.length);
        if (elapsed < openCount * this.actionFrameDuration) {
            return this.pickFrameByTime(activeFrames.slice(0, openCount), elapsed);
        }
        const loopFrames = activeFrames.slice(Math.max(0, openCount - 2));
        if (loopFrames.length === 0) {
            return activeFrames[activeFrames.length - 1] ?? this.glideFrames[0];
        }
        const loopIndex = Math.floor((elapsed - openCount * this.actionFrameDuration) / this.actionFrameDuration) % loopFrames.length;
        return loopFrames[loopIndex] ?? activeFrames[activeFrames.length - 1];
    }

    private setFrame(frame: SpriteFrame | null | undefined): void {
        if (this.sprite && frame) {
            this.sprite.spriteFrame = frame;
        }
    }
}
