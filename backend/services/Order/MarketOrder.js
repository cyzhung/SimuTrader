const { OrderAbstract } = require('./OrderAbstract');

class MarketOrder extends OrderAbstract {
    constructor(orderInfo) {
        super(orderInfo);
    }

    async match(orderBook) {
        // TODO: 實現市價單的撮合邏輯
        await orderBook.matchMarketOrder(this);
    }
}

module.exports = { MarketOrder };
