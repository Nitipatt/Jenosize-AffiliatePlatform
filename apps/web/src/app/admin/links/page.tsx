'use client';

import { useEffect, useState } from 'react';

import { fetchWithAuth } from '../../../lib/api';
import { useTranslation } from '../../../lib/i18n/context';

interface Product {
  id: string;
  title: string;
}

interface Campaign {
  id: string;
  name: string;
}

interface LinkItem {
  id: string;
  shortCode: string;
  targetUrl: string;
  createdAt: string;
  product: { title: string };
  campaign: { name: string };
  _count: { clicks: number };
}

export default function LinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [form, setForm] = useState({ product_id: '', campaign_id: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const apiUrl = '';

  const fetchAll = async () => {
    try {
      const [linksRes, productsRes, campaignsRes] = await Promise.all([
        fetchWithAuth(`${apiUrl}/api/links`),
        fetchWithAuth(`${apiUrl}/api/products`),
        fetchWithAuth(`${apiUrl}/api/campaigns`),
      ]);
      if (linksRes.ok) setLinks(await linksRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
      if (campaignsRes.ok) setCampaigns(await campaignsRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetchWithAuth(`${apiUrl}/api/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? 'Failed to generate link');
      }

      setForm({ product_id: '', campaign_id: '' });
      await fetchAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (shortCode: string) => {
    const url = `${window.location.origin}/go/${shortCode}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('links.title')}</h1>
        <p className="text-gray-500 mt-1">{t('links.subtitle')}</p>
      </div>

      {/* Generate Link Form */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">{t('links.generateLink')}</h3>
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('links.product')}</label>
            <select
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-[#0166E0] focus:ring-1 focus:ring-[#0166E0] transition-colors"
              required
            >
              <option value="">{t('links.selectProduct')}</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('links.campaign')}</label>
            <select
              value={form.campaign_id}
              onChange={(e) => setForm({ ...form, campaign_id: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-[#0166E0] focus:ring-1 focus:ring-[#0166E0] transition-colors"
              required
            >
              <option value="">{t('links.selectCampaign')}</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary whitespace-nowrap disabled:opacity-50 px-6 py-2.5 rounded-xl h-[46px]"
          >
            {loading ? t('links.generating') : t('links.generateButton')}
          </button>
        </form>
        {error && <p className="mt-3 text-red-500 text-sm font-medium">{error}</p>}
      </div>

      {/* Links Table */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">{t('links.allLinks')} ({links.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-semibold">{t('links.thShortCode')}</th>
                <th className="pb-3 font-semibold">{t('links.thProduct')}</th>
                <th className="pb-3 font-semibold">{t('links.thCampaign')}</th>
                <th className="pb-3 font-semibold">{t('links.thClicks')}</th>
                <th className="pb-3 font-semibold">{t('links.thCreated')}</th>
                <th className="pb-3 font-semibold text-right">{t('links.thAction')}</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4">
                    <code className="text-sm bg-[#0166E0]/10 px-2 py-1 rounded border border-[#0166E0]/20 text-[#0166E0] font-semibold">
                      /go/{link.shortCode}
                    </code>
                  </td>
                  <td className="py-4">
                    <span className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-xs md:max-w-[280px] block" title={link.product?.title}>
                      {link.product?.title}
                    </span>
                  </td>
                  <td className="py-4 text-gray-500">{link.campaign?.name}</td>
                  <td className="py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#01BE8C]/10 text-[#01BE8C]">
                      {link._count?.clicks ?? 0}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-gray-500">
                    {new Date(link.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => copyToClipboard(link.shortCode)}
                      className="text-sm text-[#0166E0] hover:text-[#00BCCE] transition font-medium"
                    >
                      {t('common.copy')}
                    </button>
                  </td>
                </tr>
              ))}
              {links.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    {t('links.noLinks')}
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
