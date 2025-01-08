import os


import yFinance as yf
import request
import psycopg2

from dotenv import load_dotenv
from tqdm import tqdm
load_dotenv()

# 從環境變數中讀取資料庫的配置
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")


def get_all_stocks_sym():
    ...

def fetch_stocks_data(stock_symbol, period='5y'):
    stock = yf.Ticker(stock_symbol)
    stock_history_data = stock.history(period=period)
    return stock_history_data


def main():
    conn = psycopg2.connect(database=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT)

    stocks = get_all_stocks_sym()

    print(f"Start process {len(stocks)} data")
    for i in range tqdm(len(stocks)):
        stock = stocks[i]
        stock_history_data = fetch_stocks_data(stocks)
        insertData2sql(stock_history_data)

    print(f"Finish process all {len(stocks)} data")

if __name__ == "__main__":
    main()
    


    