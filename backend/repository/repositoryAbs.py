from abc import ABC, abstractmethod
from backend.database.database import Database
from utils.errors import DatabaseError

class RepositoryAbstract(ABC):
    table_name = None  # 具體子類別應該指定表名

    @classmethod
    async def get(cls, filters={}, columns=[]):
        """
        根據篩選條件從數據庫中查詢資料
        :param filters: 篩選條件 (dict)
        :param columns: 查詢的欄位 (list) 若未提供則查詢所有欄位
        """
        try:
            pool = Database.get_pool()
            query_parts = [f"SELECT {', '.join(columns)} FROM {cls.table_name} WHERE 1=1"] if columns else [f"SELECT * FROM {cls.table_name} WHERE 1=1"]
            values = []
        
            order_by = filters.pop("order_by", None)

            for idx, (key, value) in enumerate(filters.items(), start=1):
                if value is not None:
                    if isinstance(value, list):
                        placeholders = ", ".join(f"${i}" for i in range(idx, idx + len(value)))
                        query_parts.append(f"AND {key} IN ({placeholders})")
                        values.extend(value)
                    else:
                        query_parts.append(f"AND {key} = ${idx}")
                        values.append(value)
            
            if order_by:
                query_parts.append(f"ORDER BY {order_by}")
            
            query = " ".join(query_parts)
            return await pool.fetch(query, *values)
        
        except Exception as e:
            print(f"Error getting {cls.table_name}: {e}")
            raise DatabaseError(f"{cls.table_name} 資料庫查詢錯誤: {str(e)}")

    @classmethod
    @abstractmethod
    async def insert(cls, data, transaction=None):
        raise NotImplementedError("Method not implemented")

    @classmethod
    @abstractmethod
    async def update(cls, record_id, data, transaction=None):
        raise NotImplementedError("Method not implemented")

    @classmethod
    @abstractmethod
    async def delete(cls, record_id, transaction=None):
        raise NotImplementedError("Method not implemented")
