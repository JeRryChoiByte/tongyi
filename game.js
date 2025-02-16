// 初始化棋局
const Chess = function() {
    // 初始化棋盘状态
    let board = Array(8).fill().map(() => Array(8).fill(null));
    // 初始化棋子位置
    board[0] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    board[1] = Array(8).fill('p');
    board[6] = Array(8).fill('P');
    board[7] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];

    // 获取当前棋盘状态
    this.getBoard = function() {
        return board;
    };

    // 移动棋子
    this.move = function({ from, to, promotion }) {
        const [fromX, fromY] = [from[0].charCodeAt(0) - 'a'.charCodeAt(0), 8 - parseInt(from[1])];
        const [toX, toY] = [to[0].charCodeAt(0) - 'a'.charCodeAt(0), 8 - parseInt(to[1])];

        const piece = board[fromY][fromX];
        if (!piece) return null;

        board[toY][toX] = piece;
        board[fromY][fromX] = null;

        return { from, to, piece };
    };
};