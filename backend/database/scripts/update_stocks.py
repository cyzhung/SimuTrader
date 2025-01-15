import requests;
import psycopg2
import json;

from datetime import datetime;

from backend.database.scripts.utils import get_stocks_info, get_Listed_Company, isListedCompany
from backend.database.scripts.utils import DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT



def main():
    stocks_info = get_stocks_info()
    listed_company = get_Listed_Company()
    conn = psycopg2.connect(database=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT)
    
    with conn.cursor() as cur:
        for symbol, name, price in stocks_info:
            market_type = "上市" if isListedCompany(symbol, listed_company) else "上櫃"
            current_time = datetime.now()
            sql = """
                    INSERT INTO stocks (stock_symbol, price, stock_name, market_type, updated_at)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (stock_symbol)
                    DO UPDATE SET price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;
                    """
            cur.execute(sql, (symbol, price, name, market_type, current_time))
            conn.commit()
    
    print("已更新股票資訊，現在時間:", datetime.now())
if __name__=='__main__':
    main()