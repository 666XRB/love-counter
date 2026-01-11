import React from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';

const ReportTemplate = ({ reportRef, records, exportType = '全部' }) => {
  const total = records.length;
  const fiveStars = records.filter(r => r.rating === 5).length;
  const fourStars = records.filter(r => r.rating === 4).length;
  const threeStars = records.filter(r => r.rating === 3).length;
  const twoStars = records.filter(r => r.rating === 2).length;
  const oneStar = records.filter(r => r.rating === 1).length;
  const avgRating = total > 0 ? (records.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : 0;
  const fiveStarRate = total > 0 ? ((fiveStars / total) * 100).toFixed(1) : 0;
  
  // 获取时间段信息
  const getTimeRange = () => {
    const now = new Date();
    switch (exportType) {
      case 'week':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now),
          label: '本周'
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: '本月'
        };
      case 'year':
        return {
          start: startOfYear(now),
          end: endOfYear(now),
          label: '本年'
        };
      case 'custom':
        return {
          start: records.length > 0 ? new Date(Math.min(...records.map(r => r.date.getTime()))) : now,
          end: records.length > 0 ? new Date(Math.max(...records.map(r => r.date.getTime()))) : now,
          label: '自定义时间'
        };
      default:
        return {
          start: records.length > 0 ? new Date(Math.min(...records.map(r => r.date.getTime()))) : now,
          end: records.length > 0 ? new Date(Math.max(...records.map(r => r.date.getTime()))) : now,
          label: '全部时间'
        };
    }
  };
  
  const timeRange = getTimeRange();
  
  // 生成简化热力图数据
  const generateHeatmapData = () => {
    const heatmapData = {};
    records.forEach(record => {
      const dateStr = format(record.date, 'yyyy-MM-dd');
      heatmapData[dateStr] = (heatmapData[dateStr] || 0) + 1;
    });
    return heatmapData;
  };
  
  const heatmapData = generateHeatmapData();

  return (
    <div ref={reportRef} className="bg-white p-8 w-full max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-pink-600">爱计数 - 甜蜜报告</h1>
        <p className="text-sm text-slate-500 mt-2">生成时间：{format(new Date(), 'yyyy年MM月dd日 HH:mm')}</p>
        <p className="text-sm text-slate-600 mt-1">统计周期：{timeRange.label}（{format(timeRange.start, 'yyyy年MM月dd日')} 至 {format(timeRange.end, 'yyyy年MM月dd日')}）</p>
      </div>
      
      {/* 核心统计数据 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-pink-50 to-white">
          <div className="text-lg font-bold text-pink-600">{total}</div>
          <div className="text-xs text-slate-500">累计次数</div>
        </div>
        <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-pink-50 to-white">
          <div className="text-lg font-bold text-orange-500">{avgRating}</div>
          <div className="text-xs text-slate-500">平均评分</div>
        </div>
        <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-pink-50 to-white">
          <div className="text-lg font-bold text-purple-500">{fiveStarRate}%</div>
          <div className="text-xs text-slate-500">五星率</div>
        </div>
      </div>
      
      {/* 评分分布 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">评分分布</h2>
        <div className="space-y-2">
          {[
            { stars: 5, count: fiveStars, color: 'bg-pink-600' },
            { stars: 4, count: fourStars, color: 'bg-pink-400' },
            { stars: 3, count: threeStars, color: 'bg-pink-300' },
            { stars: 2, count: twoStars, color: 'bg-pink-200' },
            { stars: 1, count: oneStar, color: 'bg-pink-100' }
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-16 text-sm font-medium">{item.stars} ⭐</div>
              <div className="flex-1 bg-gray-100 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${item.color}`}
                  style={{ width: total > 0 ? `${(item.count / total) * 100}%` : '0%' }}
                ></div>
              </div>
              <div className="w-12 text-right text-sm">{item.count} 次</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 每日记录统计 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">每日记录统计</h2>
        <div className="border rounded-lg p-4 bg-gray-50">
          {(() => {
            // 按日期分组记录
            const dailyRecords = {};
            records.forEach(record => {
              const dateStr = format(record.date, 'yyyy-MM-dd');
              if (!dailyRecords[dateStr]) {
                dailyRecords[dateStr] = {
                  date: dateStr,
                  count: 0,
                  ratings: []
                };
              }
              dailyRecords[dateStr].count += 1;
              dailyRecords[dateStr].ratings.push(record.rating);
            });
            
            // 计算每日平均评分
            Object.values(dailyRecords).forEach(day => {
              day.avgRating = day.ratings.length > 0 
                ? (day.ratings.reduce((sum, r) => sum + r, 0) / day.ratings.length).toFixed(1)
                : 0;
            });
            
            // 按日期排序
            const sortedDays = Object.values(dailyRecords).sort((a, b) => 
              new Date(a.date) - new Date(b.date)
            );
            
            return (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">日期</th>
                      <th className="p-2 text-center">次数</th>
                      <th className="p-2 text-center">平均评分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDays.map((day, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-2">{format(new Date(day.date), 'yyyy-MM-dd')}</td>
                        <td className="p-2 text-center font-medium">{day.count}</td>
                        <td className="p-2 text-center">{day.avgRating} ⭐</td>
                      </tr>
                    ))}
                    {sortedDays.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-slate-500">
                          该时间段内暂无记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </div>
      
      {/* 最近详细记录 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">最近详细记录</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">时间</th>
                <th className="p-2 text-center">评分</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 20).map((record, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-2">{format(record.date, 'yyyy-MM-dd HH:mm')}</td>
                  <td className="p-2 text-center">{record.rating} ⭐</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={2} className="p-4 text-center text-slate-500">
                    该时间段内暂无记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {records.length > 20 && (
          <p className="text-xs text-slate-500 mt-2 text-center">
            注：仅显示最近20条记录，完整记录共 {records.length} 条
          </p>
        )}
      </div>
      
      {/* 总结分析 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">分析总结</h2>
        <div className="border rounded-lg p-4 bg-pink-50">
          {total === 0 ? (
            <p className="text-slate-600 text-center">该时间段内暂无记录，开始创造美好的回忆吧！</p>
          ) : (
            <>
              <p className="text-slate-600 mb-2">
                在{timeRange.label}期间，你们共记录了 <span className="font-bold text-pink-600">{total}</span> 次甜蜜时刻，
                平均评分为 <span className="font-bold text-orange-500">{avgRating}</span> 星，
                其中五星好评占比 <span className="font-bold text-purple-500">{fiveStarRate}%</span>。
              </p>
              {avgRating >= 4.5 && (
                <p className="text-slate-600 mt-2">
                  🌟 <span className="font-medium">太棒了！</span> 你们的关系非常和谐，满意度很高，继续保持这份甜蜜！
                </p>
              )}
              {avgRating >= 3.5 && avgRating < 4.5 && (
                <p className="text-slate-600 mt-2">
                  💖 <span className="font-medium">不错哦！</span> 你们的关系很稳定，满意度良好，继续努力提升！
                </p>
              )}
              {avgRating < 3.5 && (
                <p className="text-slate-600 mt-2">
                  💪 <span className="font-medium">需要加油！</span> 建议多沟通，了解彼此需求，共同创造更美好的体验。
                </p>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="text-center text-xs text-slate-400 mt-12">
        <p>© 2024 爱计数 - 记录每一个甜蜜瞬间</p>
        <p className="mt-1">本报告仅作为个人纪念，请勿分享给他人</p>
      </div>
    </div>
  );
};

export default ReportTemplate;