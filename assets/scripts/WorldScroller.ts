import { _decorator, Component, Node, UITransform } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('WorldScroller')
export class WorldScroller extends Component {
    @property
    public speedMultiplier = 1;

    @property
    public wrapWidth = 1280;

    public scroll(dt: number, speed: number): void {
        const dx = speed * this.speedMultiplier * dt;
        const visibleLeft = -this.wrapWidth * 0.5;
        for (const child of this.node.children) {
            const pos = child.position.clone();
            pos.x -= dx;
            child.setPosition(pos);
        }
        const ordered = [...this.node.children].sort((a, b) => a.position.x - b.position.x);
        for (const child of ordered) {
            const pos = child.position.clone();
            const width = this.widthOf(child);
            if (pos.x + width * 0.5 <= visibleLeft) {
                const rightmost = [...this.node.children].sort((a, b) => b.position.x - a.position.x)[0];
                const rightWidth = this.widthOf(rightmost);
                pos.x = rightmost.position.x + (rightWidth + width) * 0.5 - 0.5;
                child.setPosition(pos);
            }
        }
    }

    private widthOf(node: Node): number {
        return node.getComponent(UITransform)?.contentSize.width ?? this.wrapWidth;
    }
}
