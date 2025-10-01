import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { adminAPI } from '@/api/admin';
import { Loader, TrendingUp } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MonthlyData { _id: { year: number; month: number }; count: number }
interface CityData { _id: string; count: number; avgPrice: number }
interface TypeData { _id: string; avgPrice: number; count: number }

export default function AnalyticsPage() {
  const [data, setData] = useState<{
    monthlyProperties: MonthlyData[];
    propertiesByCity: CityData[];
    avgPriceByType: TypeData[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAnalytics()
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return (
    <div className="flex justify-center py-20"><Loader size={32} className="animate-spin text-blue-500" /></div>
  );

  if (!data) return <div className="text-center py-20 text-gray-400">Failed to load analytics</div>;

  const monthlyChartData = data.monthlyProperties.map(d => ({
    month: MONTHS[(d._id.month - 1)],
    listings: d.count,
  }));

  const cityChartData = data.propertiesByCity.map(d => ({
    city: d._id,
    count: d.count,
    avgPrice: Math.round(d.avgPrice),
  }));

  const typeChartData = data.avgPriceByType.map(d => ({
    name: d._id.charAt(0).toUpperCase() + d._id.slice(1),
    avgPrice: Math.round(d.avgPrice),
    count: d.count,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <TrendingUp size={24} className="text-blue-500" />
        <h1 className="text-2xl font-extrabold text-gray-900">Analytics</h1>
      </div>

      {/* Monthly listings trend */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-bold text-lg text-gray-900 mb-6">Monthly Listings Growth</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={monthlyChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 13 }}
            />
            <Line
              type="monotone"
              dataKey="listings"
              stroke="#3B82F6"
              strokeWidth={2.5}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Properties by city */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-bold text-lg text-gray-900 mb-6">Listings by City</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cityChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="city" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }}
              />
              <Bar dataKey="count" fill="#3B82F6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Properties by type (pie) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-bold text-lg text-gray-900 mb-6">Listings by Type</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={typeChartData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={85}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {typeChartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Average price by type */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-bold text-lg text-gray-900 mb-6">Average Price by Property Type (Birr/month)</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={typeChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }}
              formatter={(v: number) => [`${v.toLocaleString()} birr`, 'Avg Price']}
            />
            <Legend />
            <Bar dataKey="avgPrice" name="Avg Price (birr)" fill="#10B981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* City avg price table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-lg text-gray-900">Price by City</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-6 py-3 text-left">City</th>
              <th className="px-6 py-3 text-left">Listings</th>
              <th className="px-6 py-3 text-left">Avg Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cityChartData.map(c => (
              <tr key={c.city} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">{c.city}</td>
                <td className="px-6 py-3 text-gray-600">{c.count}</td>
                <td className="px-6 py-3 text-blue-700 font-semibold">{c.avgPrice.toLocaleString()} birr</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
