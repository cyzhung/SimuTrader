class RepositroyAbstract{
    static async get(filters={}){
        throw new Error('Method not implemented');
    }

    static async insert(data){
        throw new Error('Method not implemented');
    }

    static async update(id, data){
        throw new Error('Method not implemented');
    }

    static async delete(id){
        throw new Error('Method not implemented');
    }

}

module.exports = RepositroyAbstract;