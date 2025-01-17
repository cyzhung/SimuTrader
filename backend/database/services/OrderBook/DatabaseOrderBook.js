const OrderBook_abs = require('./OrderBookFactory');


class DatabaseOrderBook extends OrderBook_abs{
    constructor(){
        this.buyOrderList = []
    }
    addOrder(order){
        
        if(this.matchOrder(order))
            return;
        this.buyOrderList.push(order)
    }

    async matchOrder(order){

        //從資料庫中找尋匹配的訂單
        const result = await DatabaseUtils.matchOrder(order);
        if(result.rows.length==0)
            return false;
    }
}