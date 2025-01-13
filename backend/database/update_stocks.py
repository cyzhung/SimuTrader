import requests;
import psycopg2
import json;

from datetime import datetime;

from utils import get_stocks_info
from utils import DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT



def main():
    stocks_info = get_stocks_info()
    conn = psycopg2.connect(database=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT)
    
    with conn.cursor() as cur:
        for symbol, name, price in stocks_info:
            current_time = datetime.now()
            sql = """UPDATE stocks SET price = %s, updated_at = %s WHERE stock_symbol = %s;"""
            cur.execute(sql, (price, current_time, symbol))
            conn.commit()
    
    print("已更新股票資訊，現在時間:", datetime.now())
if __name__=='__main__':
    main()