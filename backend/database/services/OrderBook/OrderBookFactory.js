
class AbstractOrderBook{
    constructor(){
        if(new.target===AbstractOrderBook)
            throw new Error("Abstract Class can not be instantiated directly.")
    }

    async addOrder(order){
        throw new Error("abstractMethod() must be implemented in derived classes.");
    }

    async deleteOrder(order_id, user_id){
        throw new Error("abstractMethod() must be implemented in derived classes.");
    }

    async matchOrder(order){
        throw new Error("abstractMethod() must be implemented in derived classes.");
    }
    
    async _transaction(order1, order2){
        throw new Error("abstractMethod() must be implemented in derived classes.");
    }
}

module.exports = AbstractOrderBook
