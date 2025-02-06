class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.status = 400;  // HTTP 狀態碼
        
        // 捕獲堆棧跟踪
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * 格式化錯誤響應
     * @returns {Object} 格式化的錯誤對象
     */
    toJSON() {
        return {
            success: false,
            error: {
                name: this.name,
                message: this.message,
                status: this.status
            }
        };
    }
}

// 其他自定義錯誤類型
class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
        this.status = 401;
        Error.captureStackTrace(this, this.constructor);
    }
}

class AuthorizationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthorizationError';
        this.status = 403;
        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
        this.status = 404;
        Error.captureStackTrace(this, this.constructor);
    }
}

// 新增的錯誤類型
class DatabaseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DatabaseError';
        this.status = 500;
        Error.captureStackTrace(this, this.constructor);
    }
}

class TransactionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TransactionError';
        this.status = 500;
        Error.captureStackTrace(this, this.constructor);
    }
}

class OrderBookError extends Error {
    constructor(message) {
        super(message);
        this.name = 'OrderBookError';
        this.status = 500;
        Error.captureStackTrace(this, this.constructor);
    }
}

class StockError extends Error {
    constructor(message) {
        super(message);
        this.name = 'StockError';
        this.status = 400;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ForbiddenError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ForbiddenError';
        this.status = 403;
        Error.captureStackTrace(this, this.constructor);
    }
}

class OrderError extends Error {
    constructor(message) {
        super(message);
        this.name = 'OrderError';
        this.status = 400;
        Error.captureStackTrace(this, this.constructor);
    }
}
// 統一的 toJSON 方法
const errorToJSON = function() {
    return {
        success: false,
        error: {
            name: this.name,
            message: this.message,
            status: this.status
        }
    };
};

// 為所有錯誤類添加 toJSON 方法
[
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    DatabaseError,
    TransactionError,
    OrderBookError,
    StockError,
    ForbiddenError,
    OrderError
].forEach(errorClass => {
    errorClass.prototype.toJSON = errorToJSON;
});

module.exports = {
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    DatabaseError,
    TransactionError,
    OrderBookError,
    StockError,
    ForbiddenError,
    OrderError
};
