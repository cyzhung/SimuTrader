const { OrderAbstract } = require('./OrderAbstract');

class LimitOrder extends OrderAbstract {
    constructor(orderInfo) {
        super(orderInfo);
        this.price = orderInfo.price;
    }

    validate_order() {
        const errors = super.validate_order();
        
        if (this.price <= 0) {
            errors.push({ field: 'price', message: '價格必須大於0' });
        }

        return errors;
    }
    
    async match(orderBook) {
        // TODO: 實現限價單的撮合邏輯
        await orderBook.matchLimitOrder(this);
    }
}

module.exports = { LimitOrder };
