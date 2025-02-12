const { LimitOrder } = require('./LimitOrder');
const { MarketOrder } = require('./MarketOrder');

class OrderFactory {
    static createOrder(orderInfo) {
        if (orderInfo.price) {
            return new LimitOrder(orderInfo);
        } else {
            return new MarketOrder(orderInfo);
        }
    }
}

module.exports = OrderFactory;
