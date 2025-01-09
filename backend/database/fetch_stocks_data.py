import os
import requests

import yfinance as yf
import psycopg2
import pandas as pd

from psycopg2.extras import execute_values
from dotenv import load_dotenv
from tqdm import tqdm
from bs4 import BeautifulSoup

load_dotenv()

# 從環境變數中讀取資料庫的配置
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")


def get_stocks_info():
    stocks_info = []
    stock_id_map = {}
    #獲取撿股讚網站資料
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "application/json",  # 指定接收 JSON 格式的內容
    }

    web = requests.get("https://stock.wespai.com/p/3752", headers=headers)
    soup = BeautifulSoup(web.text, 'html.parser')
    all_stock = soup.tbody.find_all('tr')
    for stock in all_stock:
        stock_symbol, name, _ = [x.text for x in stock.find_all('td')]
        stocks_info.append((stock_symbol, name))
        stock_id_map[stock_symbol] = len(stocks_info)

    return stocks_info, stock_id_map

def get_Listed_Company():
    TWSE_LISTED_URL = "https://openapi.twse.com.tw/v1/opendata/t187ap03_L"
    response = requests.get(TWSE_LISTED_URL)
    data = response.json()

    listed_company = []
    # 判斷股票代號是否在上市公司列表中
    for stock in data:
        listed_company.append(stock["公司代號"])
    
    return listed_company  # 非上市公司

def insert_stocks(symbol, name, listed_company, cur):
    sql = """INSERT INTO stocks (stock_symbol, stock_name, market_type) VALUES (%s, %s, %s) ON CONFLICT (stock_symbol) DO NOTHING"""
    if(symbol in listed_company):
        market_type = '上市'
    else:
        market_type = '上櫃'
    cur.execute(sql, (symbol, name, market_type))

def insert_history_data(stock_symbol, stock_id, cur, listed_company, period='max'):
    if(stock_symbol in listed_company):
        market_type = '上市'
    else:
        market_type = '上櫃'

    history_data = fetch_stocks_data(stock_symbol, period, market_type)
    dates = [d.strftime('%Y-%m-%d') for d in history_data.index]
    data_to_insert = list(zip([stock_id]*len(history_data), dates, history_data['Open'], history_data['Close'], history_data['High'], history_data['Low'], history_data['Volume']))

    sql = """INSERT INTO stock_prices (stock_id, price_date, open_price, close_price, high_price, low_price, volume) VALUES %s ON CONFLICT (stock_id, price_date) DO NOTHING"""
    execute_values(cur, sql, data_to_insert)
    


def fetch_stocks_data(stock_symbol, period, market_type):
    if(market_type=='上市'):
        stock_symbol = stock_symbol + '.TW'
    elif(market_type=='上櫃'):
        stock_symbol = stock_symbol + '.TWO'
    stock = yf.Ticker(stock_symbol)
    stock_history_data = stock.history(period=period)
    return stock_history_data


def main():
    listed_company = get_Listed_Company()
    conn = psycopg2.connect(database=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT)

    stocks_info, stocks_id_map = get_stocks_info()

    print(f"Start establish  {len(stocks_info)} stocks")
    for i in tqdm(range(len(stocks_info))):
        symbol, name = stocks_info[i]
        with conn.cursor() as cur:
            insert_stocks(symbol, name, listed_company, cur)
        conn.commit()
    print(f"Finish establish all {len(stocks_info)} data")

    print(f"Start establish  {len(stocks_info)} stocks_prices")
    for i in tqdm(range(len(stocks_info))):
        symbol, name = stocks_info[i]
        with conn.cursor() as cur:
            stock_id = stocks_id_map[symbol]
            insert_history_data(symbol, stock_id, cur, listed_company)
        conn.commit()
    print(f"Finish establish all {len(stocks_info)} data")




if __name__ == "__main__":
    main()
    


    