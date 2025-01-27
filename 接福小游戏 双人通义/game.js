class Game {
    constructor() {
        // 初始化页面元素
        this.welcomePage = document.getElementById('welcomePage');
        this.gamePage = document.getElementById('gamePage');
        this.resultModal = document.getElementById('resultModal');
        this.player1 = document.getElementById('player');  // 玩家1
        this.player2 = document.getElementById('player2'); // 直接获取玩家2
        this.gameArea = document.getElementById('gameArea');
        
        // 游戏数据
        this.player1Score = 0;
        this.player2Score = 0;
        this.player1Items = 0;  // 玩家1收集的道具数
        this.player2Items = 0;  // 玩家2收集的道具数
        this.timeLeft = 30;
        this.isPlaying = false;
        this.dropInterval = null;
        this.moveSpeed = 160;
        
        // 修改玩家区域引用
        this.player1Area = document.getElementById('player1Area');
        this.player2Area = document.getElementById('player2Area');
        this.player1LastScore = 0;
        this.player2LastScore = 0;
        
        // 绑定按钮事件
        document.getElementById('startButton').onclick = () => this.startGame();
        document.getElementById('restartButton').onclick = () => this.resetGame();
        
        // 绑定键盘控制
        document.addEventListener('keydown', (e) => {
            if (!this.isPlaying) return;
            
            // 玩家1 WASD控制
            if (e.key.toLowerCase() === 'a') this.movePlayer(this.player1, -this.moveSpeed);
            if (e.key.toLowerCase() === 'd') this.movePlayer(this.player1, this.moveSpeed);
            
            // 玩家2 方向键控制
            if (e.key === 'ArrowLeft') this.movePlayer(this.player2, -this.moveSpeed);
            if (e.key === 'ArrowRight') this.movePlayer(this.player2, this.moveSpeed);
        });
        
        // 初始化排名系统
        this.rankings = JSON.parse(localStorage.getItem('rankings')) || [];
        this.currentUser = this.getNextUser();
        document.getElementById('currentUser').textContent = this.currentUser;
        this.updateRankingList();
    }

    startGame() {
        document.getElementById('buttonSound').play();
        document.getElementById('bgMusic').play();
        
        this.welcomePage.classList.remove('active');
        this.gamePage.classList.add('active');
        
        // 重置游戏状态
        this.player1Score = 0;
        this.player2Score = 0;
        this.player1Items = 0;
        this.player2Items = 0;
        this.timeLeft = 30;
        this.isPlaying = true;
        this.player1LastScore = 0;
        this.player2LastScore = 0;
        
        // 更新显示
        document.getElementById('player1Score').textContent = '0';
        document.getElementById('player2Score').textContent = '0';
        document.getElementById('timerValue').textContent = '30';
        document.getElementById('gameStatus').textContent = '游戏开始';
        
        // 重置玩家位置
        this.player1.style.left = '50%';
        this.player2.style.left = '50%';
        
        this.startTimer();
        this.dropItems();
    }

    movePlayer(player, distance) {
        const currentLeft = player.offsetLeft;
        const newLeft = currentLeft + distance;
        const area = player === this.player1 ? this.player1Area : this.player2Area;
        const maxLeft = area.clientWidth - (player.clientWidth / 2);
        const minLeft = player.clientWidth / 2;
        
        if (newLeft >= minLeft && newLeft <= maxLeft) {
            player.style.left = `${newLeft}px`;
        }
    }

    dropItems() {
        const items = [
            { type: 'yuanbao', score: 1 },
            { type: 'hongbao', score: 1 },
            { type: 'fudai', score: 1 },
            { type: 'jintiao', score: 1 },
            { type: 'zhuanshi', score: 1 },
            { type: 'zhihongbao', score: 1 },
            { type: 'dahongbao', score: 1 }
        ];

        this.dropInterval = setInterval(() => {
            // 每次为每个玩家区域生成2-3个物品
            const itemCount = Math.floor(Math.random() * 2) + 2; // 随机2-3个
            
            // 玩家1区域生成物品
            for(let i = 0; i < itemCount; i++) {
                this.createItem(items, this.player1Area, 1);
            }
            
            // 玩家2区域生成物品
            for(let i = 0; i < itemCount; i++) {
                this.createItem(items, this.player2Area, 2);
            }
        }, 200);  // 缩短生成间隔从333ms到200ms
    }

    createItem(items, area, playerNum) {
        const item = items[Math.floor(Math.random() * items.length)];
        // 随机位置，但保持一定间距
        const left = Math.random() * (area.clientWidth - 100) + 50;
        
        const treasure = document.createElement('div');
        treasure.className = 'treasure';
        treasure.style.left = `${left}px`;
        treasure.style.top = '0px';
        treasure.style.backgroundImage = `url('image/${item.type}.png')`;
        treasure.dataset.type = item.type;
        treasure.dataset.score = item.score;
        
        area.appendChild(treasure);
        
        let top = 0;
        const fall = setInterval(() => {
            if (!this.isPlaying) {
                clearInterval(fall);
                treasure.remove();
                return;
            }
            
            top += 8;
            treasure.style.top = `${top}px`;
            
            const player = playerNum === 1 ? this.player1 : this.player2;
            if (this.checkCollision(player, treasure)) {
                this.handleCollision(treasure, playerNum);
                clearInterval(fall);
                treasure.remove();
            }
            
            if (top > area.clientHeight) {
                clearInterval(fall);
                treasure.remove();
            }
        }, 20);
    }

    handleCollision(treasure, playerNum) {
        const score = parseInt(treasure.dataset.score);
        let audioId = 'music1'; // 默认音效

        // 根据道具类型选择音效
        switch (treasure.dataset.type) {
            case 'yuanbao':
                audioId = 'music1';
                break;
            case 'hongbao':
                audioId = 'music2';
                break;
            case 'fudai':
                audioId = 'music3';
                break;
            case 'jintiao':
                audioId = 'music4';
                break;
            default:
                audioId = 'music1';
                break;
        }

        document.getElementById(audioId).play();

        if (treasure.dataset.type === 'zhadan') {
            document.getElementById('bombSound').play();
            this.endGame(playerNum === 1 ? 2 : 1);
        } else {
            if (playerNum === 1) {
                this.player1Score += score;
                document.getElementById('player1Score').textContent = this.player1Score;
                // 检查是否增加了2分
                if (this.player1Score >= this.player1LastScore + 2) {
                    this.player1LastScore = this.player1Score;
                    this.dropBomb(2);  // 给玩家2增加炸弹
                }
            } else {
                this.player2Score += score;
                document.getElementById('player2Score').textContent = this.player2Score;
                // 检查是否增加了2分
                if (this.player2Score >= this.player2LastScore + 2) {
                    this.player2LastScore = this.player2Score;
                    this.dropBomb(1);  // 给玩家1增加炸弹
                }
            }
        }
    }

    dropBomb(targetPlayer) {
        const area = targetPlayer === 1 ? this.player1Area : this.player2Area;
        const player = targetPlayer === 1 ? this.player1 : this.player2;
    
        const bomb = document.createElement('div');
        bomb.className = 'treasure';
        bomb.style.backgroundImage = "url('image/zhadan.png')";
        bomb.dataset.type = 'zhadan';
        bomb.dataset.score = -1;
    
        const playerRect = player.getBoundingClientRect();
        const areaRect = area.getBoundingClientRect();
        bomb.style.left = `${playerRect.left - areaRect.left + playerRect.width/2}px`;
        bomb.style.top = '0px';
    
        area.appendChild(bomb);
    
        let top = 0;
        const fall = setInterval(() => {
            if (!this.isPlaying) {
                clearInterval(fall);
                bomb.remove();
                return;
            }
        
            top += 12;
            bomb.style.top = `${top}px`;
        
            if (this.checkCollision(player, bomb)) {
                document.getElementById('bombSound').play(); // 播放炸弹音效
                this.handleCollision(bomb, targetPlayer);
                clearInterval(fall);
                bomb.remove();
            }
        
            if (top > area.clientHeight) {
                clearInterval(fall);
                bomb.remove();
            }
        }, 20);
    }

    endGame(winner = 0) {
        this.isPlaying = false;
        clearInterval(this.dropInterval);
        
        const winnerText = winner === 0 ? 
            (this.player1Score > this.player2Score ? "玩家1胜利！" : 
             this.player1Score < this.player2Score ? "玩家2胜利！" : "平局！") :
            `玩家${winner}胜利！`;
        
        document.getElementById('gameStatus').textContent = winnerText;
        this.resultModal.style.display = 'flex';
        document.getElementById('finalScore').textContent = winnerText;
        
        document.getElementById('bgMusic').pause();
        document.getElementById('bgMusic').currentTime = 0;
    }

    resetGame() {
        // 清理游戏区域
        const treasures = document.querySelectorAll('.treasure');
        treasures.forEach(t => t.remove());
        
        // 重置玩家位置
        this.player1.style.left = '50%';
        this.player2.style.left = '50%';
        
        // 返回欢迎页
        this.resultModal.style.display = 'none';
        this.gamePage.classList.remove('active');
        this.welcomePage.classList.add('active');
        
        // 更新当前用户为下一个用户
        this.currentUser = this.getNextUser();
        document.getElementById('currentUser').textContent = this.currentUser;
        
        // 重新显示排行榜
        this.updateRankingList();
    }

    getNextUser() {
        const lastUser = this.rankings[this.rankings.length - 1];
        if (!lastUser) return '用户1';
        const lastNumber = parseInt(lastUser.name.replace('用户', ''));
        return `用户${lastNumber + 1}`;
    }

    updateRankingList() {
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = '';
        
        // 按分数排序，只显示前10名
        const sortedRankings = [...this.rankings]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        
        sortedRankings.forEach((rank, index) => {
            const item = document.createElement('div');
            item.className = `ranking-item${rank.name === this.currentUser ? ' current' : ''}`;
            item.innerHTML = `
                <span>${index + 1}. ${rank.name}</span>
                <span>${rank.score}</span>
            `;
            rankingList.appendChild(item);
        });
    }

    checkCollision(player, treasure) {
        const playerRect = player.getBoundingClientRect();
        const itemRect = treasure.getBoundingClientRect();
        
        // 调整碰撞检测区域，只检测玩家上半部分
        const collisionBox = {
            left: playerRect.left + playerRect.width * 0.25,  // 缩小碰撞箱宽度
            right: playerRect.right - playerRect.width * 0.25,
            top: playerRect.top,
            bottom: playerRect.top + playerRect.height * 0.3  // 只检测上部分
        };
        
        return !(collisionBox.right < itemRect.left || 
                collisionBox.left > itemRect.right || 
                collisionBox.bottom < itemRect.top || 
                collisionBox.top > itemRect.bottom);
    }

    startTimer() {
        const timer = setInterval(() => {
            if (!this.isPlaying) {
                clearInterval(timer);
                return;
            }
            
            this.timeLeft--;
            document.getElementById('timerValue').textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                clearInterval(timer);
                this.endGame();
            }
        }, 1000);
    }
}

// 初始化游戏
window.onload = () => new Game(); 