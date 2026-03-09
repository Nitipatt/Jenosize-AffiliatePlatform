'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { fetchWithAuth } from '../../../lib/api';
import { useTranslation } from '../../../lib/i18n/context';

interface DashboardData {
  total_clicks: number;
  top_campaigns: Array<{
    id: string;
    name: string;
    clicks: number;
  }>;
  top_products: Array<{
    id: string;
    title: string;
    clicks: number;
    offers: Array<{ marketplace: string; price: number }>;
  }>;
  clicks_over_time: Array<{ date: string; count: number }>;
}

const COLORS = ['#5c7cfa', '#845ef7', '#f06595', '#fcc419', '#51cf66', '#22b8cf'];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchWithAuth(`/api/dashboard`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <p className="text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="text-sm font-semibold text-gray-500 mb-2">{t('dashboard.totalClicks')}</div>
          <div className="text-4xl font-bold text-[#0166E0]">
            {data?.total_clicks?.toLocaleString() ?? 0}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="text-sm font-semibold text-gray-500 mb-2">{t('dashboard.activeCampaigns')}</div>
          <div className="text-4xl font-bold text-[#00BCCE]">
            {data?.top_campaigns?.length ?? 0}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="text-sm font-semibold text-gray-500 mb-2">{t('dashboard.trackedProducts')}</div>
          <div className="text-4xl font-bold text-[#01BE8C]">
            {data?.top_products?.length ?? 0}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Clicks Over Time */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">{t('dashboard.clicksOverTime')}</h3>
          {data?.clicks_over_time && data.clicks_over_time.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.clicks_over_time}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #f3f4f6',
                    borderRadius: '12px',
                    color: '#111827',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="count" fill="#0166E0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              {t('dashboard.noClickData')}
            </div>
          )}
        </div>

        {/* Top Campaigns Pie */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">{t('dashboard.clicksByCampaign')}</h3>
          {data?.top_campaigns && data.top_campaigns.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.top_campaigns}
                  dataKey="clicks"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={4}
                  label={({ name }) => name}
                >
                  {data.top_campaigns.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #f3f4f6',
                    borderRadius: '12px',
                    color: '#111827',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              {t('dashboard.noCampaignData')}
            </div>
          )}
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">{t('dashboard.topProducts')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-semibold">{t('dashboard.thProduct')}</th>
                <th className="pb-3 font-semibold">{t('dashboard.thClicks')}</th>
                <th className="pb-3 font-semibold">{t('dashboard.thBestPrice')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.top_products?.map((product) => (
                <tr key={product.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4">
                    <span className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-xs md:max-w-sm block" title={product.title}>
                      {product.title}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0166E0]/10 text-[#0166E0]">
                      {product.clicks}
                    </span>
                  </td>
                  <td className="py-4 text-emerald-600 font-bold">
                    {product.offers?.[0]
                      ? `฿${Number(product.offers[0].price).toLocaleString()}`
                      : '—'}
                  </td>
                </tr>
              ))}
              {(!data?.top_products || data.top_products.length === 0) && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-400">
                    {t('dashboard.noProductsTracked')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
