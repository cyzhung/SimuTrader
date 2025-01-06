import React, { useState } from "react";

const ApiTest = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/api/test"); // 替換為你的後端 API 路徑
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>API 測試組件</h1>
      <button onClick={fetchData} style={{ padding: "10px", fontSize: "16px" }}>
        測試 API
      </button>

      {loading && <p>載入中...</p>}
      {error && <p style={{ color: "red" }}>錯誤: {error}</p>}
      {data && (
        <div>
          <h2>回傳資料:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ApiTest;
