
class AbstractOrderBook{
    constructor(){
        if(new.target===AbstractOrderBook)
            throw new Error("Abstract Class can not be instantiated directly.")
    }

    async addOrder(order){
        try {
            const result = await DatabaseUtils.insertOrder(order);
            console.log(`Order ${order.id} has been added to the database.`);
            return result;
        } catch (error) {
            console.error("Error adding order to database:", error);
            throw error;
        }
    }

    matchOrder(order){
        throw new Error("abstractMethod() must be implemented in derived classes.");
    }
    
}

module.exports = AbstractOrderBook