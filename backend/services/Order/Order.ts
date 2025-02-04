export interface Order {
    user_id: string,
    stock_id: string;
    price: number;
    quantity: number;
    order_side: string; // 單個值
    order_type: string; // 單個值
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
    if (!order.user_id) errors.push({ field: 'user_id', message: '用戶ID不能為空' });
    if (!order.stock_id) errors.push({ field: 'stock_id', message: '股票id不能為空' });
    
    // 數值檢查
    if (order.price <= 0) errors.push({ field: 'price', message: '價格必須大於0' });
    if (order.quantity <= 0) errors.push({ field: 'quantity', message: '數量必須大於0' });
    
    // 枚舉值檢查
    if (VALID_SIDES.indexOf(order.order_side) === -1) {
      errors.push({ field: 'order_side', message: '交易方向必須是 Buy 或 Sell' });
    }
    if (VALID_TYPES.indexOf(order.order_type) === -1) {
      errors.push({ field: 'order_type', message: '訂單類型必須是 Limit 或 Market' });
    }
    
    return errors;
  }
  
  export function createOrder(order: Order): Order {
    // 先验证订单
    const validationErrors = validateOrder(order);
    if (validationErrors.length > 0) {
      throw new Error(`订单验证失败: ${JSON.stringify(validationErrors)}`);
    }
  
    // 创建订单并返回
    return {
      ...order,
      timestamp: order.timestamp || Date.now(),
    };
  }