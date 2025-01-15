export interface Order {
    orderId: string;
    userId: string;
    symbol: string;
    price: number;
    quantity: number;
    side: "Buy" | "Sell";
    type: "Limit" | "Market";
    timestamp?: number; // 可選屬性
  }
  
export function createOrder(order: Order): Order {
    return {
      ...order,
      timestamp: order.timestamp || Date.now(), // 設置默認值
    };
  }
  