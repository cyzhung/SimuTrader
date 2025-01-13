
import psycopg2
import yfinance as yf

from tqdm import tqdm
from utils import get_Listed_Company, get_stocks_info, get_stocks_id_map, isListedCompany
from utils import DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
from psycopg2.extras import execute_values

def fetch_stocks_data(stock_symbol, period):
    if (isListedCompany(stock_symbol)):
        stock_symbol = stock_symbol + '.TW'
    else:
        stock_symbol = stock_symbol + '.TWO'
    stock = yf.Ticker(stock_symbol)
    stock_history_data = stock.history(period=period)
    return stock_history_data


def insert_stocks(stock_symbol, stock_name, stock_price, cur):
    sql = """INSERT INTO stocks (stock_symbol, stock_name, price, market_type) VALUES (%s, %s, %s, %s) ON CONFLICT (stock_symbol) DO NOTHING"""
    market_type = '上市' if isListedCompany(stock_symbol) else '上櫃'
    cur.execute(sql, (stock_symbol, stock_name, stock_price, market_type))

def insert_history_data(stock_symbol, stock_id, cur, period='max'):
    market_type = '上市' if isListedCompany(stock_symbol) else '上櫃'
    history_data = fetch_stocks_data(stock_symbol, period, market_type)
    dates = [d.strftime('%Y-%m-%d') for d in history_data.index]
    data_to_insert = list(zip([stock_id]*len(history_data), dates, history_data['Open'], history_data['Close'], history_data['High'], history_data['Low'], history_data['Volume']))

    sql = """INSERT INTO stock_prices (stock_id, price_date, open_price, close_price, high_price, low_price, volume) VALUES %s ON CONFLICT (stock_id, price_date) DO NOTHING"""
    execute_values(cur, sql, data_to_insert)


def main():
    conn = psycopg2.connect(database=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT)

    stocks_info = get_stocks_info()
    stocks_id_map = get_stocks_id_map()
    print(f"Start establish  {len(stocks_info)} stocks")
    for i in tqdm(range(len(stocks_info))):
        symbol, name, price = stocks_info[i]
        with conn.cursor() as cur:
            insert_stocks(symbol, name, price, cur)
            stock_id = stocks_id_map[symbol]
            insert_history_data(symbol, stock_id, cur)
        conn.commit()
    print(f"Finish establish all {len(stocks_info)} data")