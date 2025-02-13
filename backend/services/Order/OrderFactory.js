const { LimitOrder } = require('./LimitOrder');
const { MarketOrder } = require('./MarketOrder');
const { StockRepository } = require('../../repository/StockRepository');
class OrderFactory {
    static async createOrder(orderInfo) {
        if(!orderInfo.stock_id){
            const stock = await StockRepository.get({stock_symbol: orderInfo.stock_symbol});
            if(!stock.rows.length){
                throw new ValidationError('股票不存在');
            }
            orderInfo.stock_id = stock.rows[0].stock_id;
        }
        if (orderInfo.price) {
            return new LimitOrder(orderInfo);
        } else {
            return new MarketOrder(orderInfo);
        }
    }
}

module.exports = OrderFactory;
