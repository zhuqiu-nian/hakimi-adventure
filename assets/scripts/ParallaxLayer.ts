import { _decorator, Component, Node, UITransform } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ParallaxLayer')
export class ParallaxLayer extends Component {
    @property
    public ratio = 0.35;

    @property
    public wrapWidth = 1280;

    public tick(dt: number, speed: number): void {
        const dx = speed * this.ratio * dt;
        const visibleLeft = -this.wrapWidth * 0.5;
        for (const child of this.node.children) {
            const pos = child.position.clone();
            pos.x -= dx;
            child.setPosition(pos);
        }
        const ordered = [...this.node.children].sort((a, b) => a.position.x - b.position.x);
        for (const child of ordered) {
            const width = this.widthOf(child);
            if (child.position.x + width * 0.5 > visibleLeft) {
                continue;
            }
            const rightmost = [...this.node.children].sort((a, b) => b.position.x - a.position.x)[0];
            const pos = child.position.clone();
            pos.x = rightmost.position.x + (this.widthOf(rightmost) + width) * 0.5 - 0.5;
            child.setPosition(pos);
        }
    }

    private widthOf(node: Node): number {
        return node.getComponent(UITransform)?.contentSize.width ?? this.wrapWidth;
    }
}
