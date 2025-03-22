from typing import Dict, Any, List, Optional
from backend.database.database import Database
from backend.repository.transactionLogsRepository import TransactionLogsRepository
from backend.repository.orderRepository import OrderRepository
from backend.repository.userRepository import UserRepository
from backend.repository.stocksRepository import StockRepository
from backend.repository.userStocksRepository import UserStocksRepository
#from backend.services.orderbook.orderbookService import OrderBookService
from backend.services.order.orderService import OrderService
from utils.errors import ValidationError

class TransactionService:
    @staticmethod
    async def _validate_transaction_data(transaction_data: Dict[str, Any]) -> None:
        """
        驗證交易數據
        
        Args:
            transaction_data: 交易數據
            
        Raises:
            ValidationError: 當驗證失敗時
        """
        # 檢查用戶
        if not await UserRepository.user_exist(transaction_data["user_id"]):
            raise ValidationError(f"用戶 {transaction_data['user_id']} 不存在")

        # 檢查股票
        stocks = await StockRepository.get({
            "stock_symbol": transaction_data["stock_symbol"]
        })
        if not stocks.rows:
            raise ValidationError(f"股票代碼 {transaction_data['stock_symbol']} 不存在")

    @staticmethod
    async def create_buy_transaction(transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        創建買入訂單並進行撮合
        
        Args:
            transaction_data: 交易數據
            
        Returns:
            Dict[str, Any]: 交易結果
            
        Raises:
            ValidationError: 當驗證失敗時
        """
        async with Database.transaction() as client:
            try:
                # 1. 基礎驗證
                await TransactionService._validate_transaction_data(transaction_data)
                
                # 2. 創建訂單
                order = await TransactionService._create_order(transaction_data, client)

                # 3. 進行撮合
                transactions = await TransactionService._process_transaction(order, client)
                
                # 4. 更新用戶持股
                if transactions:
                    await TransactionService._update_user_holdings(transactions, client)
                    transaction_info = TransactionService._compute_transactions_info(transactions)
                    await TransactionService._update_order_state(order, transaction_info)

                # 5. 返回結果
                return TransactionService._format_transaction_result(order, transaction_info)

            except Exception as error:
                raise error

    @staticmethod
    async def create_sell_transaction(transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        創建賣出訂單並進行撮合
        
        Args:
            transaction_data: 交易數據
            
        Returns:
            Dict[str, Any]: 交易結果
            
        Raises:
            ValidationError: 當驗證失敗時
        """
        async with Database.transaction() as client:
            try:
                # 1. 基礎驗證
                stock_id = await TransactionService._validate_transaction_data_and_get_stock_id(
                    transaction_data
                )

                # 2. 檢查持股
                await TransactionService._validate_user_holdings(transaction_data, client)
                
                # 3. 創建訂單
                transaction_data["stock_id"] = stock_id
                order = await TransactionService._create_order(transaction_data, client)

                # 4. 進行撮合
                transactions = await TransactionService._process_transaction(order, client)
                
                # 5. 更新用戶持股
                if transactions:
                    await TransactionService._update_user_holdings(
                        transaction_data, 
                        transactions, 
                        client
                    )

                # 6. 返回結果
                transaction_info = TransactionService._compute_transactions_info(transactions)
                return TransactionService._format_transaction_result(order, transaction_info)

            except Exception as error:
                raise error
            
    @staticmethod
    async def _update_user_holdings(
        transaction_data: Dict[str, Any], 
        transactions: List[Dict[str, Any]], 
        client: Any
    ) -> None:
        """更新用戶持股"""
        for transaction in transactions:
            if transaction_data["order_side"] == "Buy":
                await TransactionService._update_buyer_holdings(
                    transaction_data, 
                    transaction, 
                    client
                )
            else:
                await TransactionService._update_seller_holdings(
                    transaction_data, 
                    transaction, 
                    client
                )

    @staticmethod
    async def _update_buyer_holdings(
        transaction_data: Dict[str, Any], 
        transaction: Dict[str, Any], 
        client: Any
    ) -> None:
        """更新買方持股"""
        order_result = await OrderRepository.get({"order_id": transaction["order_id"]})
        user_id = order_result.rows[0]["user_id"]

        stock_result = await StockRepository.get({
            "stock_symbol": transaction["stock_symbol"]
        })
        stock_id = stock_result.rows[0]["stock_id"]

        user_stocks = await UserStocksRepository.get({
            "user_id": user_id,
            "stock_id": stock_id
        })

        if not user_stocks.rows:
            await UserStocksRepository.insert({
                "user_id": transaction_data["user_id"],
                "stock_id": transaction_data["stock_id"],
                "quantity": transaction["quantity"],
                "purchase_price": transaction["price"]
            }, transaction=client)
        else:
            current_holding = user_stocks.rows[0]
            new_quantity = current_holding["quantity"] + transaction["quantity"]
            new_avg_price = (
                current_holding["purchase_price"] * current_holding["quantity"] +
                transaction["price"] * transaction["quantity"]
            ) / new_quantity
            
            await UserStocksRepository.update({
                "user_id": transaction_data["user_id"],
                "stock_id": transaction_data["stock_id"],
                "quantity": new_quantity,
                "purchase_price": new_avg_price
            }, transaction=client)

    @staticmethod
    async def _update_seller_holdings(
        transaction_data: Dict[str, Any], 
        transaction: Dict[str, Any], 
        client: Any
    ) -> None:
        """更新賣方持股"""
        current_holding = await UserStocksRepository.get({
            "user_id": transaction_data["user_id"],
            "stock_id": transaction_data["stock_id"]
        })

        new_quantity = current_holding.rows[0]["quantity"] - transaction["quantity"]
        
        if new_quantity == 0:
            await UserStocksRepository.delete({
                "user_id": transaction_data["user_id"],
                "stock_id": transaction_data["stock_id"]
            }, client)
        else:
            await UserStocksRepository.update({
                "user_id": transaction_data["user_id"],
                "stock_id": transaction_data["stock_id"],
                "quantity": new_quantity
            }, client)
    @staticmethod
    async def _validate_transaction_data_and_get_stock_id(
        transaction_data: Dict[str, Any]
    ) -> int:
        """驗證交易數據並獲取股票ID"""
        if not await UserRepository.user_exist(transaction_data["user_id"]):
            raise ValidationError(f"用戶 {transaction_data['user_id']} 不存在")

        stocks = await StockRepository.get({
            "stock_symbol": transaction_data["stock_symbol"]
        })
        if not stocks.rows:
            raise ValidationError(f"股票代碼 {transaction_data['stock_symbol']} 不存在")

        return stocks.rows[0]["stock_id"]

    @staticmethod
    async def _validate_user_holdings(
        transaction_data: Dict[str, Any], 
        client: Any
    ) -> None:
        """驗證用戶持股"""
        user_stocks = await UserStocksRepository.get({
            "user_id": transaction_data["user_id"],
            "stock_id": transaction_data["stock_id"]
        }, transaction=client)
        
        if (not user_stocks.rows or 
            user_stocks.rows[0]["quantity"] < transaction_data["quantity"]):
            raise ValidationError("持股不足")

    @staticmethod
    async def _create_order(
        transaction_data: Dict[str, Any], 
        client: Any
    ) -> Dict[str, Any]:
        """創建訂單"""
        order = await OrderService.create_order(transaction_data)
        order_id = await OrderRepository.insert(order, transaction=client)
        return {**order, "order_id": order_id}

    @staticmethod
    async def _process_transaction(
        order: Dict[str, Any], 
        client: Any
    ) -> List[Dict[str, Any]]:
        """處理交易撮合"""
        await OrderBookService.add_order(order)
        transactions = await order.match()
        for transaction in transactions:
            await TransactionLogsRepository.insert(transaction, transaction=client)
        return transactions

    @staticmethod
    def _compute_transactions_info(
        transactions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """計算交易信息"""
        avg_price = sum(t["transaction_price"] for t in transactions)
        quantity = sum(t["transaction_quantity"] for t in transactions)
        
        return {
            "total_quantity": quantity,
            "avg_price": avg_price / len(transactions) if transactions else 0
        }

    @staticmethod
    async def _update_order_state(
        order: Dict[str, Any], 
        transaction_info: Dict[str, Any]
    ) -> None:
        """更新訂單狀態"""
        if order["order_type"] == "Market":
            before_quantity = order["quantity"] - order["remaining_quantity"]
            total_quantity = before_quantity + transaction_info["total_quantity"]
            before_price = order["price"] * before_quantity
            transaction_price = (
                transaction_info["avg_price"] * 
                transaction_info["total_quantity"]
            )
            new_price = (before_price + transaction_price) / total_quantity

            await OrderRepository.update({
                "order_id": order["order_id"],
                "price": new_price,
                "remaining_quantity": order["remaining_quantity"]
            })

    @staticmethod
    def _format_transaction_result(
        order: Dict[str, Any], 
        transaction_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """格式化交易結果"""
        return {
            "order_id": order["order_id"],
            "stock_id": order["stock_id"],
            "quantity": transaction_info["total_quantity"],
            "price": transaction_info["avg_price"],
            "status": order["status"],
            "message": "交易成功"
        }