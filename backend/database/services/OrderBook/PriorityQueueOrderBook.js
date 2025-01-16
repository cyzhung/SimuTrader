const { match } = require('assert');
const OrderBook_abs = require('./OrderBookFactory');
const priorityQueue = require('./PriorityQueue')

class PriorityQueueOB extends OrderBook_abs{
    constructor(){
        this.buyQueue = priorityQueue(true);
        this.sellQueue = priorityQueue(false);
    }

    addOrder(order){
        super().addOrder();

        //若成功撮合 則不加入至Queue等待
        if(matchOrder(order)){
            this._transaction(order);
            return;
        }

        const type = Order.type
        if (type==="buy"){
            this.buyQueue.enqueue(order);
        }
        else if (type==="sell"){
            this.sellQueue.enqueue(order);
        }
    }

    matchOrder(order){
        
        if(order.side=="Buy"){
            const sellOrder = this.sellQueue.getTop();
            if(order.price>=sellOrder.price)
                return true;
            return false;
        }
        else if(order.side=="Sell"){
            const buyOrder = this.sellQueue.getTop();
            if(order.price<=buyOrder.price)
                return true;
            return false;
        }
    }

    _transaction(order1,  order2)
    {
        
    }
}