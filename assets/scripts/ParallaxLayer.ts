import { _decorator, Component, Node, UITransform } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ParallaxLayer')
export class ParallaxLayer extends Component {
    @property
    public ratio = 0.35;

    @property
    public wrapWidth = 1280;

    @property
    public overlap = 1;

    public tick(dt: number, speed: number): void {
        const dx = speed * this.ratio * dt;
        if (this.node.children.length === 0 || dx === 0) {
            return;
        }

        for (const child of this.node.children) {
            const pos = child.position.clone();
            pos.x -= dx;
            child.setPosition(pos);
        }

        const visibleLeft = -this.wrapWidth * 0.5;
        let ordered = [...this.node.children].sort((a, b) => a.position.x - b.position.x);
        while (ordered.length > 1) {
            const leftmost = ordered[0];
            const width = this.widthOf(leftmost);
            if (leftmost.position.x + width * 0.5 > visibleLeft - this.overlap) {
                break;
            }
            const rightmost = ordered[ordered.length - 1];
            const pos = leftmost.position.clone();
            pos.x = rightmost.position.x + (this.widthOf(rightmost) + width) * 0.5 - this.overlap;
            leftmost.setPosition(pos);
            ordered = [...this.node.children].sort((a, b) => a.position.x - b.position.x);
        }
    }

    private widthOf(node: Node): number {
        return node.getComponent(UITransform)?.contentSize.width ?? this.wrapWidth;
    }
}
