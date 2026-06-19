import { _decorator, Component, Rect, UITransform } from 'cc';

const { ccclass, property } = _decorator;

export type ObstaclePassType = 'jump' | 'slide';

@ccclass('Obstacle')
export class Obstacle extends Component {
    @property
    public hitPaddingX = 12;

    @property
    public hitPaddingY = 10;

    public passType: ObstaclePassType = 'jump';

    public obstacleKind = '';

    public passed = false;

    public getHitBox(): Rect {
        const transform = this.getComponent(UITransform);
        const size = transform ? transform.contentSize : { width: 80, height: 80 };
        const pos = this.node.worldPosition;
        const width = Math.max(8, size.width - this.hitPaddingX * 2);
        const height = Math.max(8, size.height - this.hitPaddingY * 2);
        return new Rect(pos.x - width * 0.5, pos.y - height * 0.5, width, height);
    }
}
