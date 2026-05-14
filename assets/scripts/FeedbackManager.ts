import { _decorator, Color, Component, Label, Node, Sprite, SpriteFrame, tween, UITransform, Vec3 } from 'cc';

const { ccclass } = _decorator;

@ccclass('FeedbackManager')
export class FeedbackManager extends Component {
    private floatRoot: Node | null = null;
    private pulseRoot: Node | null = null;
    private coinFrame: SpriteFrame | null = null;

    public setup(coinFrame: SpriteFrame | null): void {
        this.coinFrame = coinFrame;
        this.floatRoot = this.makeNode('FloatingTextRoot', this.node, Vec3.ZERO);
        this.pulseRoot = this.makeNode('PulseRoot', this.node, Vec3.ZERO);
    }

    public showText(text: string, position: Vec3, color = new Color(255, 236, 111, 255), size = 26): void {
        if (!this.floatRoot) {
            return;
        }
        const labelNode = this.makeNode('FloatText', this.floatRoot, position);
        const transform = labelNode.addComponent(UITransform);
        transform.setContentSize(320, size + 18);
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = size + 8;
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.isBold = true;
        labelNode.setScale(0.82, 0.82, 1);
        tween(labelNode)
            .to(0.12, { scale: new Vec3(1.12, 1.12, 1) })
            .parallel(
                tween().by(0.72, { position: new Vec3(0, 74, 0) }),
                tween().to(0.72, { scale: new Vec3(0.92, 0.92, 1) }),
            )
            .call(() => labelNode.destroy())
            .start();
    }

    public showCoin(position: Vec3, amount = 1): void {
        this.showText(`+${amount}`, position.clone().add(new Vec3(0, 34, 0)), new Color(255, 207, 63, 255), 24);
        if (!this.floatRoot || !this.coinFrame) {
            return;
        }
        const node = this.makeNode('CoinPop', this.floatRoot, position);
        const transform = node.addComponent(UITransform);
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = this.coinFrame;
        transform.setContentSize(38, 38);
        tween(node)
            .to(0.1, { scale: new Vec3(1.28, 1.28, 1) })
            .parallel(
                tween().by(0.5, { position: new Vec3(0, 62, 0) }),
                tween().to(0.5, { scale: new Vec3(0.25, 0.25, 1) }),
            )
            .call(() => node.destroy())
            .start();
    }

    public showPulse(frame: SpriteFrame | null, position: Vec3, color: Color, size = 124): void {
        if (!this.pulseRoot || !frame) {
            return;
        }
        const node = this.makeNode('PowerPulse', this.pulseRoot, position);
        const transform = node.addComponent(UITransform);
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = frame;
        sprite.color = color;
        transform.setContentSize(size, size);
        node.setScale(0.45, 0.45, 1);
        tween(node)
            .to(0.18, { scale: new Vec3(1.18, 1.18, 1) })
            .to(0.32, { scale: new Vec3(1.6, 1.6, 1) })
            .call(() => node.destroy())
            .start();
    }

    public shake(node: Node | null, strength = 10): void {
        if (!node) {
            return;
        }
        const origin = node.position.clone();
        tween(node)
            .to(0.04, { position: origin.clone().add(new Vec3(strength, 0, 0)) })
            .to(0.04, { position: origin.clone().add(new Vec3(-strength, 0, 0)) })
            .to(0.04, { position: origin.clone().add(new Vec3(strength * 0.45, 0, 0)) })
            .to(0.04, { position: origin })
            .start();
    }

    private makeNode(name: string, parent: Node, pos: Vec3): Node {
        const node = new Node(name);
        parent.addChild(node);
        node.setPosition(pos);
        return node;
    }
}
