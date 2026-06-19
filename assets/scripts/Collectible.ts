import { _decorator, Component, Rect, UITransform } from 'cc';

const { ccclass, property } = _decorator;

export type CollectibleKind = 'coin' | 'magnet' | 'shield' | 'score' | 'dash' | 'fishDart' | 'mysteryBox';

@ccclass('Collectible')
export class Collectible extends Component {
    @property
    public value = 1;

    @property
    public kind: CollectibleKind = 'coin';

    public coinTone = '';

    public isFlyingCoin = false;

    private taken = false;

    public reset(): void {
        this.taken = false;
        this.node.active = true;
        this.node.setScale(1, 1, 1);
    }

    public collect(): number {
        if (this.taken) {
            return 0;
        }

        this.taken = true;
        this.node.active = false;
        return this.value;
    }

    public getHitBox(): Rect {
        const transform = this.getComponent(UITransform);
        const size = transform ? transform.contentSize : { width: 48, height: 48 };
        const pos = this.node.worldPosition;
        const width = size.width * 0.72;
        const height = size.height * 0.72;
        return new Rect(pos.x - width * 0.5, pos.y - height * 0.5, width, height);
    }
}
