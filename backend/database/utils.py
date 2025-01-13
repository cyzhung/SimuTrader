import os
import requests
import json

import psycopg2
import pandas as pd

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

# 從環境變亮中讀取需要的路徑及URL
STOCK_INFO_URL = os.getenv("STOCK_INFO_URL")
TWSE_LISTED_URL = os.getenv("TWSE_LISTED_URL")
STOCKS_ID_MAP_FILEPATH = os.getenv("STOCKS_ID_MAP_FILEPATH")



def get_stocks_info():
    stocks_info = []
    #獲取撿股讚網站資料
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "application/json",  # 指定接收 JSON 格式的內容
    }

    web = requests.get(STOCK_INFO_URL, headers=headers)
    soup = BeautifulSoup(web.text, 'html.parser')
    all_stock = soup.tbody.find_all('tr')
    for stock in all_stock:
        stock_symbol, name, price = [x.text for x in stock.find_all('td')]
        stocks_info.append((stock_symbol, name, price))

    return stocks_info

def get_Listed_Company():
    response = requests.get(TWSE_LISTED_URL)
    data = response.json()

    listed_company = []
    # 判斷股票代號是否在上市公司列表中
    for stock in data:
        listed_company.append(stock["公司代號"])
    
    return listed_company  # 非上市公司

def get_stocks_id_map():
    return json.loads(STOCKS_ID_MAP_FILEPATH)

def isListedCompany(stock_symbol):
    listed_company = get_Listed_Company()
    if stock_symbol in listed_company:
        return True
    else:
        return False