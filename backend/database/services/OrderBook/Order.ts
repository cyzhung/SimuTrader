export interface Order {
  user_id: string;
  stock_symbol: string;
  price: number;
  quantity: number;
  side: string; // 單個值
  type: string; // 單個值
  timestamp?: number;
}

export interface OrderValidationError {
  field: string;
  message: string;
}

const VALID_SIDES: string[] = ["Buy", "Sell"];
const VALID_TYPES: string[] = ["Limit", "Market"];

export function validateOrder(order: Order): OrderValidationError[] {
  const errors: OrderValidationError[] = [];

  // 必填字段檢查
  if (!order.user_id) errors.push({ field: 'userId', message: '用戶ID不能為空' });
  if (!order.stock_symbol) errors.push({ field: 'symbol', message: '交易對不能為空' });
  
  // 數值檢查
  if (order.price <= 0) errors.push({ field: 'price', message: '價格必須大於0' });
  if (order.quantity <= 0) errors.push({ field: 'quantity', message: '數量必須大於0' });
  
  // 枚舉值檢查
  if (VALID_SIDES.indexOf(order.side)!==-1) {
      errors.push({ field: 'side', message: '交易方向必須是 Buy 或 Sell' });
  }
  if (VALID_TYPES.indexOf(order.type)!==-1) {
      errors.push({ field: 'type', message: '訂單類型必須是 Limit 或 Market' });
  }
  
  return errors;
}

export function createOrder(order: Order): Order {
  return {
      ...order,
      timestamp: order.timestamp || Date.now(),
  };
}
