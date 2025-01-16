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
exports.__esModule = true;
var VALID_SIDES = ["Buy", "Sell"];
var VALID_TYPES = ["Limit", "Market"];
function validateOrder(order) {
    var errors = [];
    // 必填字段檢查
    if (!order.order_id)
        errors.push({ field: 'orderId', message: '訂單ID不能為空' });
    if (!order.user_id)
        errors.push({ field: 'userId', message: '用戶ID不能為空' });
    if (!order.stock_symbol)
        errors.push({ field: 'symbol', message: '交易對不能為空' });
    // 數值檢查
    if (order.price <= 0)
        errors.push({ field: 'price', message: '價格必須大於0' });
    if (order.quantity <= 0)
        errors.push({ field: 'quantity', message: '數量必須大於0' });
    // 枚舉值檢查
    if (VALID_SIDES.indexOf(order.side) !== -1) {
        errors.push({ field: 'side', message: '交易方向必須是 Buy 或 Sell' });
    }
    if (VALID_TYPES.indexOf(order.type) !== -1) {
        errors.push({ field: 'type', message: '訂單類型必須是 Limit 或 Market' });
    }
    return errors;
}
exports.validateOrder = validateOrder;
function createOrder(order) {
    return __assign(__assign({}, order), { timestamp: order.timestamp || Date.now() });
}
exports.createOrder = createOrder;
