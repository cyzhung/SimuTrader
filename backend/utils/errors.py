import traceback
from fastapi import HTTPException

class BaseCustomException(HTTPException):
    def __init__(self, status_code: int, name: str, message: str):
        # 獲取錯誤追蹤
        error_trace = traceback.format_exc()
        # 如果沒有追蹤（直接raise的情況），獲取當前堆疊
        if error_trace == 'NoneType: None\n':
            error_trace = ''.join(traceback.format_stack()[:-1])

        # 擴展錯誤信息
        detail = {
            "success": False,
            "error": {
                "name": name,
                "message": message,
                "status": status_code,
                #"trace": error_trace
            }
        }
        
        super().__init__(status_code=status_code, detail=detail)
        self.name = name
        self.status_code = status_code
        self.message = message
        self.trace = error_trace

    def to_dict(self):
        return {
            "success": False,
            "error": {
                "name": self.name,
                "message": self.message,
                "status": self.status_code,
                "trace": self.trace
            }
        }

# 各種錯誤類別
class ValidationError(BaseCustomException):
    def __init__(self, message="請求參數驗證失敗"):
        super().__init__(400, "ValidationError", message)

class AuthenticationError(BaseCustomException):
    def __init__(self, message="身份驗證失敗"):
        super().__init__(401, "AuthenticationError", message)

class AuthorizationError(BaseCustomException):
    def __init__(self, message="未授權的操作"):
        super().__init__(403, "AuthorizationError", message)

class NotFoundError(BaseCustomException):
    def __init__(self, message="資源未找到"):
        super().__init__(404, "NotFoundError", message)

class DatabaseError(BaseCustomException):
    def __init__(self, message="資料庫錯誤"):
        super().__init__(500, "DatabaseError", message)

class TransactionError(BaseCustomException):
    def __init__(self, message="交易處理失敗"):
        super().__init__(500, "TransactionError", message)

class OrderBookError(BaseCustomException):
    def __init__(self, message="訂單簿錯誤"):
        super().__init__(500, "OrderBookError", message)

class StockError(BaseCustomException):
    def __init__(self, message="股票處理錯誤"):
        super().__init__(400, "StockError", message)

class ForbiddenError(BaseCustomException):
    def __init__(self, message="禁止存取"):
        super().__init__(403, "ForbiddenError", message)

class OrderError(BaseCustomException):
    def __init__(self, message="訂單錯誤"):
        super().__init__(400, "OrderError", message)

class MatchingError(BaseCustomException):
    def __init__(self, message="撮合錯誤"):
        super().__init__(400, "MatchingError", message)
