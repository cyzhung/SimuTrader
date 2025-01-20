class PriorityQueue {
    constructor(isMinheap = true){
        this.comparator = isMinheap
                          ? (a, b) => a.price === b.price ? a.timestamp - b.timestamp : a.price - b.price
                          : (a, b) => a.price === b.price ? b.timestamp - a.timestamp : b.price - a.price;
        this.heap = [];
    }

    enqueue(order){
        if (!order) {
            throw new Error('訂單不能為空');
        }
        
        try {
            this.heap.push(order);
            this._heapifyUp();
        } catch (error) {
            throw new Error(`入隊失敗: ${error.message}`);
        }
    }

    dequeue(){
        if (this.getSize() === 0) {
            throw new Error('隊列為空');
        }

        try {
            const size = this.getSize();
            if (size === 1) return this.heap.pop();

            const top = this.heap[0];
            this._swap(0, this.getSize() - 1);
            this.heap.pop();
            this._heapifyDown();
            return top;
        } catch (error) {
            throw new Error(`出隊失敗: ${error.message}`);
        }
    }

    getTop(){
        if (this.getSize() === 0) {
            throw new Error('隊列為空');
        }
        return this.heap[0];
    }

    getSize(){
        return this.heap.length;
    }

    _heapifyUp(){
        let index = this.getSize()-1;
        
        while( index > 0){
            const parentIndex = (index-1) / 2;
            if(this.comparator(this.heap[index], this.heap[parentIndex] >= 0))  break;
            this._swap(index, parentIndex);
            index = parentIndex;
        }

    }

    _heapifyDown(){
        let index = 0;
        const lastIndex = this.getSize() - 1;
        while(true){
            const leftChildIndex = index * 2 + 1;
            const rightChildIndex = index * 2 + 2;
            let nextIndex = index;

            if( leftChildIndex <= lastIndex &&
                this.comparator(this.heap[nextIndex], this.heap[leftChildIndex] >= 0)
            ){
                nextIndex = leftChildIndex;
            }

            if( rightChild <= lastIndex &&
                this.comparator(this.heap[nextIndex], this.heap[rightChildIndex])
            ){
                nextIndex = rightChildIndex;
            }

            if(index == nextIndex)
                break;
            this._swap(index, nextIndex);
            index = nextIndex;
        }
    }

    _swap(i,j){
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }
}

module.exports = PriorityQueue;