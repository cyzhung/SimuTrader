const OrderBook_abs = require('./OrderBookFactory');
const priorityQueue = require('./PriorityQueue')

class PriorityQueueOB extends OrderBook_abs{
    constructor(){
        this.buyQueue = priorityQueue(true);
        this.sellQueue = priorityQueue(false);
    }

    addOrder(order){
        super().addOrder();

        //若成功撮合 則不加入至buyQueue等待
        if(matchOrder(order))
            return;

        const type = Order.type
        if (type==="buy"){
            this.buyQueue.enqueue(order);
        }
        else if (type==="sell"){
            this.sellQueue.enqueue(order);
        }
    }

    matchOrder(order){
        
    }
}