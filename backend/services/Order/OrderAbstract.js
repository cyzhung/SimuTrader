const { OrderError } = require('../../utils/Errors');
const { LimitOrder } = require('./LimitOrder');
const { MarketOrder } = require('./MarketOrder');

const OrderSide = {
    Buy: "Buy",
    Sell: "Sell"
};

const OrderStatus = {
    Pending: "pending",
    Filled: "filled",
    Partial: "partial",
    Cancelled: "cancelled"
};

class OrderAbstract {
    constructor(orderInfo) {
        this.user_id = orderInfo.user_id;
        this.stock_id = orderInfo.stock_id;
        this.quantity = orderInfo.quantity;
        this.remaining_quantity = orderInfo.quantity;
        this.order_side = orderInfo.order_side;
        this.status = OrderStatus.Pending;
        this.timestamp = Date.now();

    }

    validate_order() {
        const errors = [];

        if (!this.user_id) {
            errors.push({ field: 'user_id', message: '用戶ID不能為空' });
        }
        if (!this.stock_id) {
            errors.push({ field: 'stock_id', message: '股票ID不能為空' });
        }
        if (this.quantity <= 0) {
            errors.push({ field: 'quantity', message: '數量必須大於0' });
        }
        if (!Object.values(OrderSide).includes(this.order_side)) {
            errors.push({ field: 'order_side', message: '交易方向必須是 Buy 或 Sell' });
        }

        return errors;
    }

    async match(orderBook) {
        throw new Error('match method must be implemented by subclasses');
    }

    static create_order(orderInfo) {
        if (orderInfo.price) {
            return new LimitOrder(orderInfo);
        } else {
            return new MarketOrder(orderInfo);
        }
    }
}

module.exports = {
    OrderAbstract,
    OrderSide,
    OrderStatus
};
