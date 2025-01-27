class Match3Game {
    constructor() {
        this.gridSize = 9;
        this.grid = [];
        this.selectedCell = null;
        this.score = 0;
        this.moves = 30;  // 改回30步
        this.isPlaying = true;
        this.currentLevel = 1;  // 当前关卡
        this.totalItems = 5;    // 每关固定5个道具
        
        this.gridElement = document.getElementById('grid');
        this.boundClickHandler = this.handleGridClick.bind(this); // 保存绑定的事件处理函数
        
        // 初始化音频元素
        this.bgMusic = document.getElementById('bgMusic');
        this.magicSound1 = document.getElementById('magicSound1');
        this.magicSound2 = document.getElementById('magicSound2');
        
        // 加载当前关卡
        this.loadLevel(this.currentLevel);
        
        // 添加特效相关属性
        this.effectInterval = null;
        this.startBossEffect();
    }
    
    async loadLevel(level) {
        // 停止所有音效
        this.stopAllSounds();
        
        // 加载关卡BOSS图片
        const bossImage = document.querySelector('.boss-avatar img');
        bossImage.src = `item/${level}/boss${level}.gif`;
        
        // 重置游戏状态
        this.score = 0;
        this.moves = 30;  // 改回30步
        this.isPlaying = true;
        this.selectedCell = null;
        
        // 移除旧的事件监听器
        this.gridElement.removeEventListener('click', this.boundClickHandler);
        
        // 初始化游戏
        await this.preloadLevelImages(level);
        this.initializeGrid();
        this.setupEventListeners();
        this.updateUI();
        
        // 清除旧的特效定时器
        if (this.effectInterval) {
            clearInterval(this.effectInterval);
        }
        
        // 启动新的特效定时器
        this.startBossEffect();
        
        // 加载并播放背景音乐
        this.bgMusic.src = `item/${level}/bg.wav`;
        this.magicSound1.src = `item/${level}/mg1.wav`;
        this.magicSound2.src = `item/${level}/mg2.wav`;
        
        // 确保背景音乐可以播放
        this.bgMusic.volume = 0.5;  // 设置音量为50%
        try {
            await this.bgMusic.play().catch(() => {
                // 添加点击事件来播放音乐（解决自动播放限制）
                document.addEventListener('click', () => {
                    this.bgMusic.play();
                }, { once: true });
            });
        } catch (error) {
            console.error('背景音乐播放失败:', error);
        }
    }
    
    async preloadLevelImages(level) {
        // 预加载当前关卡的所有图片
        const promises = [];
        for (let i = 1; i <= this.totalItems; i++) {
            const img = new Image();
            img.src = `item/${level}/item${i}.gif`;
            promises.push(new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            }));
        }
        try {
            await Promise.all(promises);
            console.log(`关卡 ${level} 资源加载完成`);
        } catch (error) {
            console.error(`关卡 ${level} 资源加载失败:`, error);
        }
    }
    
    initializeGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        this.grid = [];
        
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const value = Math.floor(Math.random() * this.totalItems) + 1;
                cell.dataset.value = value;
                
                const img = document.createElement('img');
                img.src = `item/${this.currentLevel}/item${value}.gif`;
                img.alt = value;
                img.draggable = false;
                cell.appendChild(img);
                
                this.grid[row][col] = {
                    element: cell,
                    value: value
                };
                
                gridElement.appendChild(cell);
            }
        }
        
        while (this.findMatches().length > 0) {
            this.shuffleGrid();
        }
    }
    
    setupEventListeners() {
        this.gridElement.addEventListener('click', this.boundClickHandler);
    }
    
    handleGridClick(e) {
        if (!this.isPlaying) return;
        
        const cell = e.target.closest('.cell');
        if (!cell) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        this.handleCellClick(row, col);
    }
    
    handleCellClick(row, col) {
        const cell = this.grid[row][col];
        
        if (!this.selectedCell) {
            this.selectedCell = cell;
            cell.element.classList.add('selected');
        } else {
            if (this.isAdjacent(this.selectedCell, cell)) {
                this.swapCells(this.selectedCell, cell);
                this.moves--;
                this.updateUI();
            }
            this.selectedCell.element.classList.remove('selected');
            this.selectedCell = null;
        }
    }
    
    isAdjacent(cell1, cell2) {
        const row1 = parseInt(cell1.element.dataset.row);
        const col1 = parseInt(cell1.element.dataset.col);
        const row2 = parseInt(cell2.element.dataset.row);
        const col2 = parseInt(cell2.element.dataset.col);
        
        return (Math.abs(row1 - row2) === 1 && col1 === col2) ||
               (Math.abs(col1 - col2) === 1 && row1 === row2);
    }
    
    async swapCells(cell1, cell2) {
        const img1 = cell1.element.querySelector('img');
        const img2 = cell2.element.querySelector('img');
        
        // 交换值和显示
        const tempValue = cell1.value;
        const tempSrc = img1.src;
        
        cell1.value = cell2.value;
        img1.src = img2.src;
        cell1.element.dataset.value = cell2.value;
        
        cell2.value = tempValue;
        img2.src = tempSrc;
        cell2.element.dataset.value = tempValue;
        
        // 检查是否形成匹配
        const matches = this.findMatches();
        if (matches.length > 0) {
            await this.handleMatches(matches);
        } else {
            // 如果没有匹配，交换回来
            const temp2Value = cell2.value;
            const temp2Src = img2.src;
            
            cell2.value = cell1.value;
            img2.src = img1.src;
            cell2.element.dataset.value = cell1.value;
            
            cell1.value = temp2Value;
            img1.src = temp2Src;
            cell1.element.dataset.value = temp2Value;
            
            // 添加交换动画效果
            cell1.element.classList.add('swap-fail');
            cell2.element.classList.add('swap-fail');
            await new Promise(resolve => setTimeout(resolve, 300));
            cell1.element.classList.remove('swap-fail');
            cell2.element.classList.remove('swap-fail');
        }
    }
    
    findMatches() {
        const matches = [];
        
        // 检查水平匹配
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize - 2; col++) {
                const cell1 = this.grid[row][col];
                const cell2 = this.grid[row][col + 1];
                const cell3 = this.grid[row][col + 2];
                
                if (cell1.value === cell2.value && cell1.value === cell3.value) {
                    matches.push([cell1, cell2, cell3]);
                }
            }
        }
        
        // 检查垂直匹配
        for (let row = 0; row < this.gridSize - 2; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell1 = this.grid[row][col];
                const cell2 = this.grid[row + 1][col];
                const cell3 = this.grid[row + 2][col];
                
                if (cell1.value === cell2.value && cell1.value === cell3.value) {
                    matches.push([cell1, cell2, cell3]);
                }
            }
        }
        
        return matches;
    }
    
    async handleMatches(matches) {
        // 标记匹配的单元格
        matches.flat().forEach(cell => {
            cell.element.classList.add('matched');
            this.score += 10;
        });
        
        // 等待消除动画完成
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 移除匹配标记
        matches.flat().forEach(cell => {
            cell.element.classList.remove('matched');
        });
        
        // 填充新的数字
        await this.refillGrid(matches);
        
        // 更新UI
        this.updateUI();
        
        // 检查新的匹配
        const newMatches = this.findMatches();
        if (newMatches.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 300));  // 添加延迟
            await this.handleMatches(newMatches);
        }
    }
    
    async refillGrid(matches) {
        const columns = new Set(matches.flat().map(cell => parseInt(cell.element.dataset.col)));
        
        for (const col of columns) {
            const matchedRows = matches.flat()
                .filter(cell => parseInt(cell.element.dataset.col) === col)
                .map(cell => parseInt(cell.element.dataset.row))
                .sort((a, b) => b - a);
            
            // 先将所有要下落的元素标记为falling
            for (const matchedRow of matchedRows) {
                for (let row = matchedRow; row >= 0; row--) {
                    const cell = this.grid[row][col].element;
                    cell.classList.add('falling');
                }
            }
            
            // 执行下落逻辑
            for (const matchedRow of matchedRows) {
                for (let row = matchedRow; row > 0; row--) {
                    const currentCell = this.grid[row][col];
                    const aboveCell = this.grid[row - 1][col];
                    
                    currentCell.value = aboveCell.value;
                    currentCell.element.querySelector('img').src = aboveCell.element.querySelector('img').src;
                    currentCell.element.dataset.value = aboveCell.value;
                }
                
                // 在最顶行生成新的随机数字
                const topCell = this.grid[0][col];
                const newValue = Math.floor(Math.random() * this.totalItems) + 1;
                topCell.value = newValue;
                topCell.element.querySelector('img').src = `item/${this.currentLevel}/item${newValue}.gif`;
                topCell.element.dataset.value = newValue;
            }
            
            // 等待动画完成后移除falling类
            await new Promise(resolve => setTimeout(resolve, 500));
            for (let row = 0; row < this.gridSize; row++) {
                this.grid[row][col].element.classList.remove('falling');
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    shuffleGrid() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                const value = Math.floor(Math.random() * this.totalItems) + 1;
                cell.value = value;
                cell.element.querySelector('img').src = `item/${this.currentLevel}/item${value}.gif`;
                cell.element.dataset.value = value;
            }
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('moves').textContent = this.moves;
        
        if (this.moves <= 0) {
            this.isPlaying = false;
            setTimeout(() => {
                alert(`游戏结束！最终得分：${this.score}`);
                this.loadLevel(this.currentLevel); // 重新开始当前关卡
            }, 100);
        } else {
            this.checkLevelComplete(); // 检查是否通关
        }
    }
    
    checkLevelComplete() {
        if (this.score >= 1000) {  // 修改为1000分通关
            this.currentLevel++;
            alert(`恭喜通过第${this.currentLevel - 1}关！\n最终得分：${this.score}\n剩余步数：${this.moves}`);
            this.loadLevel(this.currentLevel);
        }
    }
    
    startBossEffect() {
        this.effectInterval = setInterval(() => {
            this.playBossEffect();
        }, 15000);  // 从5000改为15000，即15秒
    }
    
    async playBossEffect() {
        // 切换BOSS图片
        const bossImage = document.querySelector('.boss-avatar img');
        bossImage.src = `item/${this.currentLevel}/boss2.gif`;
        
        // 播放第一个魔法音效
        try {
            await this.magicSound1.play();
            // 等待0.5秒
            await new Promise(resolve => setTimeout(resolve, 500));
            // 播放第二个魔法音效
            await this.magicSound2.play();
        } catch (error) {
            console.error('魔法音效播放失败:', error);
        }
        
        // 显示主特效
        const effectContainer = document.querySelector('.effect-container');
        const effectImage = document.getElementById('effectImage');
        effectImage.src = `item/${this.currentLevel}/ef.gif`;
        effectContainer.style.display = 'block';
        
        // 监听特效图片加载完成
        effectImage.onload = () => {
            const effectDuration = 3000;
            setTimeout(() => {
                effectContainer.style.display = 'none';
                bossImage.src = `item/${this.currentLevel}/boss1.gif`;
            }, effectDuration);
        };
    }
    
    // 添加音频控制方法
    stopAllSounds() {
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
        this.magicSound1.pause();
        this.magicSound1.currentTime = 0;
        this.magicSound2.pause();
        this.magicSound2.currentTime = 0;
    }
}

// 启动游戏
new Match3Game(); 