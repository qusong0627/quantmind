import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';
import './MainTicker.css';

const MainTicker = () => {
  const [tickerData, setTickerData] = useState(null);
  const [chartOption, setChartOption] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/market/realtime?stock_code=000001');
        const data = response.data.data;
        setTickerData(data);

        // Assuming the API returns a structure that can be used for the chart
        // You might need to adjust this based on the actual API response
        const newChartOption = {
          tooltip: {
            trigger: 'axis'
          },
          xAxis: {
            type: 'category',
            data: data.timeline.map(item => item.time)
          },
          yAxis: {
            type: 'value',
            scale: true,
            min: Math.min(...data.timeline.map(item => item.price)) * 0.99,
            max: Math.max(...data.timeline.map(item => item.price)) * 1.01
          },
          series: [{
            data: data.timeline.map(item => item.price),
            type: 'line',
            smooth: true
          }]
        };
        setChartOption(newChartOption);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data. Please make sure the backend service is running.');
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="main-ticker-container">
      <div className="ticker-header">
        <div className="ticker-info">
          <h2>{tickerData.name} {tickerData.code}</h2>
          <div className="ticker-price">
            <span className={`current-price ${tickerData.change_percent >= 0 ? 'positive' : 'negative'}`}>{tickerData.price}</span>
            <span className={`price-change ${tickerData.change_percent >= 0 ? 'positive' : 'negative'}`}>
              {tickerData.change.toFixed(2)} {tickerData.change_percent.toFixed(2)}%
            </span>
          </div>
          <p className="trade-time">{tickerData.time}</p>
        </div>
        <div className="ticker-stats">
          <div className="stat-item"><span>今开</span><span>{tickerData.open}</span></div>
          <div className="stat-item"><span>最高</span><span>{tickerData.high}</span></div>
          <div className="stat-item"><span>昨收</span><span>{tickerData.last_close}</span></div>
          <div className="stat-item"><span>最低</span><span>{tickerData.low}</span></div>
          <div className="stat-item"><span>成交量</span><span>{(tickerData.volume / 1000000).toFixed(2)}M</span></div>
          <div className="stat-item"><span>成交额</span><span>{(tickerData.turnover / 100000000).toFixed(2)}B</span></div>
        </div>
      </div>
      <div className="chart-container">
        <div className="chart-actions">
          <button className="active">分时</button>
          <button>五日</button>
          <button>日K</button>
          <button>周K</button>
          <button>月K</button>
        </div>
        <ReactECharts option={chartOption} style={{ height: '300px', width: '100%' }} />
      </div>
    </div>
  );
};

export default MainTicker;