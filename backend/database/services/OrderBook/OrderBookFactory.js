const DatabaseUtils = require('../../utils/DatabaseUtils');
const pool = require('../../../connection');

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

    async matchOrder(order){
        throw new Error("abstractMethod() must be implemented in derived classes.");
    }
    
    async _transaction(order1, order2){
        throw new Error("abstractMethod() must be implemented in derived classes.");
    }
    async addToDatabase(order){
        try {
            const result = await DatabaseUtils.insertOrder(order);
            console.log(`Order ${order.id} has been added to the database.`);
            return result;
        } catch (error) {
            console.error("Error adding order to database:", error);
            throw error;
        }
    }
}

module.exports = AbstractOrderBook
