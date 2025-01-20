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

module.exports = {
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError
};