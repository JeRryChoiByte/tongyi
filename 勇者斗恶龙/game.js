class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // 直接输出当前URL
        console.log('当前完整URL:', document.location.href);
        
        // 尝试加载图片并输出完整URL
        const imagePath = 'person/stay.gif';
        const fullURL = new URL(imagePath, document.location.href).toString();
        console.log('图片完整URL:', fullURL);
        
        // 尝试直接访问图片
        const img = new Image();
        img.onload = () => console.log('图片加载成功');
        img.onerror = () => console.log('图片加载失败');
        img.src = fullURL;

        // 加载游戏资源
        this.load.image('stay', imagePath);
    }

    create() {
        // 创建网格背景
        this.createGrid();

        // 显示调试信息
        const debugText = this.add.text(10, 10, '', { 
            fill: '#000000',
            fontSize: '14px'
        });

        debugText.setText([
            '当前URL: ' + document.location.href,
            '图片URL: ' + new URL('person/stay.gif', document.location.href).toString(),
            '图片加载状态: ' + this.textures.exists('stay')
        ].join('\n'));

        // 创建玩家精灵
        this.player = this.add.sprite(500, 500, 'stay');
        this.player.setDisplaySize(50, 50);

        // 初始化状态
        this.isMoving = false;
        this.isAttacking = false;
        this.currentDirection = 'stay';

        // 设置键盘控制
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    move(direction) {
        if (this.isMoving || this.isAttacking) return;

        const distance = 50;
        let targetX = this.player.x;
        let targetY = this.player.y;

        switch (direction) {
            case 'up': targetY -= distance; break;
            case 'down': targetY += distance; break;
            case 'left': targetX -= distance; break;
            case 'right': targetX += distance; break;
        }

        // 检查边界
        if (targetX < 25 || targetX > 975 || targetY < 25 || targetY > 975) return;

        // 设置移动动画
        this.player.setTexture(direction);
        this.isMoving = true;
        this.currentDirection = direction;

        // 使用Phaser的补间动画
        this.tweens.add({
            targets: this.player,
            x: targetX,
            y: targetY,
            duration: 1000,
            ease: 'Linear',
            onComplete: () => {
                this.isMoving = false;
                this.player.setTexture('stay');
            }
        });
    }

    attack() {
        if (this.isAttacking || this.isMoving) return;

        this.isAttacking = true;
        this.player.setTexture('attack');

        this.time.delayedCall(500, () => {
            this.isAttacking = false;
            this.player.setTexture('stay');
        });
    }

    update() {
        if (!this.isMoving && !this.isAttacking) {
            if (this.cursors.up.isDown) this.move('up');
            else if (this.cursors.down.isDown) this.move('down');
            else if (this.cursors.left.isDown) this.move('left');
            else if (this.cursors.right.isDown) this.move('right');
            else if (this.spaceKey.isDown) this.attack();
        }
    }

    createGrid() {
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0xcccccc, 0.5);

        // 绘制垂直线
        for (let x = 0; x <= 1000; x += 10) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, 1000);
        }

        // 绘制水平线
        for (let y = 0; y <= 1000; y += 10) {
            graphics.moveTo(0, y);
            graphics.lineTo(1000, y);
        }

        graphics.strokePath();
    }
}

const config = {
    type: Phaser.CANVAS,
    width: 1000,
    height: 1000,
    backgroundColor: '#ffffff',
    parent: 'game',
    scene: GameScene,
    pixelArt: true,
    render: {
        antialias: false
    }
};

window.onload = () => {
    new Phaser.Game(config);
}; 