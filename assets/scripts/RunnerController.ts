import { _decorator, Component, Sprite, SpriteFrame, Vec3 } from 'cc';

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

    public isSliding = false;
    public isAirborne = false;
    public isGliding = false;

    private velocityY = 0;
    private jumpCount = 0;
    private readonly baseScale = new Vec3(1, 1, 1);
    private slideTimer = 0;
    private animTimer = 0;
    private frameIndex = 0;
    private actionTimer = 0;
    private specialTimer = 0;
    private specialFrame: SpriteFrame | null = null;
    private sprite: Sprite | null = null;
    private runFrames: SpriteFrame[] = [];
    private jumpFrames: SpriteFrame[] = [];
    private slideFrames: SpriteFrame[] = [];
    private fallFrame: SpriteFrame | null = null;
    private glideFrames: SpriteFrame[] = [];

    public setupAnimation(
        sprite: Sprite,
        runFrames: SpriteFrame[],
        jumpFrames: SpriteFrame[],
        slideFrames: SpriteFrame | SpriteFrame[],
        fallFrame?: SpriteFrame,
        glideFrames?: SpriteFrame | SpriteFrame[],
    ): void {
        this.sprite = sprite;
        this.runFrames = runFrames;
        this.jumpFrames = jumpFrames;
        this.slideFrames = Array.isArray(slideFrames) ? slideFrames : [slideFrames];
        this.fallFrame = fallFrame ?? jumpFrames[1] ?? jumpFrames[0] ?? null;
        this.glideFrames = Array.isArray(glideFrames) ? glideFrames : (glideFrames ? [glideFrames] : [this.fallFrame].filter((frame): frame is SpriteFrame => !!frame));
        this.setFrame(this.runFrames[0]);
    }

    public reset(startX: number): void {
        this.velocityY = 0;
        this.jumpCount = 0;
        this.isSliding = false;
        this.isAirborne = false;
        this.isGliding = false;
        this.slideTimer = 0;
        this.animTimer = 0;
        this.actionTimer = 0;
        this.specialTimer = 0;
        this.specialFrame = null;
        this.frameIndex = 0;
        this.node.setPosition(startX, this.groundY, 0);
        this.node.setScale(this.baseScale);
        this.node.angle = 0;
        this.setFrame(this.runFrames[0]);
    }

    public jump(): boolean {
        if (this.isSliding) {
            return false;
        }

        if (this.jumpCount === 0) {
            this.velocityY = this.jumpVelocity;
            this.jumpCount = 1;
            this.actionTimer = 0;
            this.isAirborne = true;
            this.setFrame(this.jumpFrames[0]);
            return true;
        }

        if (this.jumpCount === 1) {
            this.velocityY = this.doubleJumpVelocity;
            this.jumpCount = 2;
            this.actionTimer = 0;
            this.isAirborne = true;
            this.setFrame(this.jumpFrames[1] ?? this.jumpFrames[0]);
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
        if (!frame || this.isSliding) {
            return;
        }
        this.specialFrame = frame;
        this.specialTimer = duration;
        this.setFrame(frame);
    }

    public slide(): boolean {
        if (this.jumpCount > 0 || this.isSliding) {
            return false;
        }

        this.isSliding = true;
        this.isGliding = false;
        this.slideTimer = this.slideDuration;
        this.actionTimer = 0;
        this.node.setScale(1.16, 0.74, 1);
        this.setFrame(this.slideFrames[0]);
        return true;
    }

    public tick(dt: number, running: boolean): void {
        if (!running) {
            return;
        }

        if (this.isSliding) {
            this.slideTimer -= dt;
            this.actionTimer += dt;
            if (this.slideTimer <= 0) {
                this.isSliding = false;
                this.node.setScale(this.baseScale);
                this.actionTimer = 0;
            }
        }

        const pos = this.node.position.clone();
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
        }

        this.node.setPosition(pos);

        if (this.specialTimer > 0 && !this.isSliding) {
            this.specialTimer -= dt;
            this.setFrame(this.specialFrame);
            return;
        }

        if (this.isSliding) {
            this.setFrame(this.pickActionFrame(this.slideFrames, this.actionTimer, this.slideTimer < 0.12));
            this.node.angle = 0;
        } else if (this.isGliding) {
            this.actionTimer += dt;
            this.setFrame(this.pickGlideFrame(this.actionTimer));
            this.node.angle = 5;
        } else if (this.jumpCount > 0) {
            this.actionTimer += dt;
            this.setFrame(this.velocityY > 80 ? this.jumpFrames[0] : (this.fallFrame ?? this.jumpFrames[0]));
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
        if (this.animTimer >= 0.13) {
            this.animTimer = 0;
            this.frameIndex = (this.frameIndex + 1) % this.runFrames.length;
            this.setFrame(this.runFrames[this.frameIndex]);
        }
    }

    private pickActionFrame(frames: SpriteFrame[], elapsed: number, preferEnd: boolean): SpriteFrame | null {
        if (frames.length === 0) {
            return null;
        }
        if (preferEnd) {
            return frames[frames.length - 1];
        }
        const index = Math.min(frames.length - 1, Math.floor(elapsed / 0.12));
        return frames[index];
    }

    private pickGlideFrame(elapsed: number): SpriteFrame | null {
        if (this.glideFrames.length === 0) {
            return null;
        }
        if (this.glideFrames.length === 1 || elapsed < 0.14) {
            return this.glideFrames[0];
        }
        return this.glideFrames[1];
    }

    private setFrame(frame: SpriteFrame | null | undefined): void {
        if (this.sprite && frame) {
            this.sprite.spriteFrame = frame;
        }
    }
}
