'use client';

import { useEffect, useState } from 'react';

import { fetchWithAuth } from '../../../lib/api';
import { useTranslation } from '../../../lib/i18n/context';

interface Campaign {
  id: string;
  name: string;
  utmCampaign: string;
  startAt: string;
  endAt: string;
  createdAt: string;
  links: Array<{ id: string }>;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [form, setForm] = useState({
    name: '',
    utm_campaign: '',
    start_at: '',
    end_at: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const apiUrl = '';

  const fetchCampaigns = async () => {
    try {
      const res = await fetchWithAuth(`${apiUrl}/api/campaigns`);
      if (res.ok) setCampaigns(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetchWithAuth(`${apiUrl}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          start_at: new Date(form.start_at).toISOString(),
          end_at: new Date(form.end_at).toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? 'Failed to create campaign');
      }

      setForm({ name: '', utm_campaign: '', start_at: '', end_at: '' });
      await fetchCampaigns();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const isActive = (c: Campaign) => {
    const now = new Date();
    return new Date(c.startAt) <= now && new Date(c.endAt) >= now;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('campaigns.title')}</h1>
        <p className="text-gray-500 mt-1">{t('campaigns.subtitle')}</p>
      </div>

      {/* Create Campaign Form */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">{t('campaigns.createCampaign')}</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('campaigns.campaignName')}</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('campaigns.campaignNamePlaceholder')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0166E0] focus:ring-1 focus:ring-[#0166E0] transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('campaigns.utmCampaign')}</label>
            <input
              type="text"
              value={form.utm_campaign}
              onChange={(e) => setForm({ ...form, utm_campaign: e.target.value })}
              placeholder={t('campaigns.utmPlaceholder')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0166E0] focus:ring-1 focus:ring-[#0166E0] transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('campaigns.startDate')}</label>
            <input
              type="date"
              value={form.start_at}
              onChange={(e) => setForm({ ...form, start_at: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-[#0166E0] focus:ring-1 focus:ring-[#0166E0] transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('campaigns.endDate')}</label>
            <input
              type="date"
              value={form.end_at}
              onChange={(e) => setForm({ ...form, end_at: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-[#0166E0] focus:ring-1 focus:ring-[#0166E0] transition-colors"
              required
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 px-6 py-2.5 rounded-xl"
            >
              {loading ? t('campaigns.creating') : t('campaigns.createButton')}
            </button>
          </div>
        </form>
        {error && <p className="mt-3 text-red-500 text-sm font-medium">{error}</p>}
      </div>

      {/* Campaigns Table */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">{t('campaigns.allCampaigns')} ({campaigns.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-semibold">{t('campaigns.thName')}</th>
                <th className="pb-3 font-semibold">{t('campaigns.thUtm')}</th>
                <th className="pb-3 font-semibold">{t('campaigns.thPeriod')}</th>
                <th className="pb-3 font-semibold">{t('campaigns.thLinks')}</th>
                <th className="pb-3 font-semibold">{t('campaigns.thStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 font-medium text-gray-900">{campaign.name}</td>
                  <td className="py-4">
                    <code className="text-sm bg-gray-100/50 text-gray-800 px-2 py-1 rounded border border-gray-200">
                      {campaign.utmCampaign}
                    </code>
                  </td>
                  <td className="py-4 text-sm text-gray-500">
                    {new Date(campaign.startAt).toLocaleDateString()} –{' '}
                    {new Date(campaign.endAt).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0166E0]/10 text-[#0166E0]">
                      {campaign.links?.length ?? 0}
                    </span>
                  </td>
                  <td className="py-4">
                    {isActive(campaign) ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {t('common.active')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        {t('common.inactive')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    {t('campaigns.noCampaigns')}
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
