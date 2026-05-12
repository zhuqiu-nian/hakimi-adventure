import { _decorator, Component, Node } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ParallaxLayer')
export class ParallaxLayer extends Component {
    @property
    public ratio = 0.35;

    @property
    public wrapWidth = 1280;

    public tick(dt: number, speed: number): void {
        const dx = speed * this.ratio * dt;
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
