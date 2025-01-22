"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOrder = validateOrder;
exports.createOrder = createOrder;
var VALID_SIDES = ["Buy", "Sell"];
var VALID_TYPES = ["Limit", "Market"];
function validateOrder(order) {
    var errors = [];
    // 必填字段檢查
    if (!order.order_id)
        errors.push({ field: 'order_id', message: '訂單ID不能為空' });
    if (!order.user_id)
        errors.push({ field: 'user_id', message: '用戶ID不能為空' });
    if (!order.stock_id)
        errors.push({ field: 'stock_id', message: '股票id不能為空' });
    // 數值檢查
    if (order.price <= 0)
        errors.push({ field: 'price', message: '價格必須大於0' });
    if (order.quantity <= 0)
        errors.push({ field: 'quantity', message: '數量必須大於0' });
    // 枚舉值檢查
    if (VALID_SIDES.indexOf(order.order_side) === -1) {
        errors.push({ field: 'order_side', message: '交易方向必須是 Buy 或 Sell' });
    }
    if (VALID_TYPES.indexOf(order.order_type) === -1) {
        errors.push({ field: 'order_type', message: '訂單類型必須是 Limit 或 Market' });
    }
    return errors;
}
function createOrder(order) {
    // 先验证订单
    var validationErrors = validateOrder(order);
    if (validationErrors.length > 0) {
        throw new Error("\u8BA2\u5355\u9A8C\u8BC1\u5931\u8D25: ".concat(JSON.stringify(validationErrors)));
    }
    // 创建订单并返回
    return __assign(__assign({}, order), { timestamp: order.timestamp || Date.now() });
}
