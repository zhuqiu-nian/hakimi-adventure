import { _decorator, Component, Node, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('WorldScroller')
export class WorldScroller extends Component {
    @property
    public speedMultiplier = 1;

    @property
    public wrapWidth = 1280;

    public scroll(dt: number, speed: number): void {
        const dx = speed * this.speedMultiplier * dt;
        for (const child of this.node.children) {
            const pos = child.position.clone();
            pos.x -= dx;
            if (pos.x <= -this.wrapWidth) {
                pos.x += this.wrapWidth * 2;
            }
            child.setPosition(pos);
        }
    }
}
