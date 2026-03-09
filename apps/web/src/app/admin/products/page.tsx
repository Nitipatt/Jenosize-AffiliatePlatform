'use client';

import { useEffect, useState } from 'react';

import { fetchWithAuth } from '../../../lib/api';
import { useTranslation } from '../../../lib/i18n/context';

interface Offer {
  id: string;
  marketplace: 'SHOPEE' | 'LAZADA';
  storeName: string;
  price: number;
  externalUrl: string;
  lastCheckedAt: string;
}

interface Product {
  id: string;
  title: string;
  imageUrl: string | null;
  createdAt: string;
  offers: Offer[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [shopeeUrl, setShopeeUrl] = useState('');
  const [lazadaUrl, setLazadaUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const { t } = useTranslation();

  const fetchProducts = async () => {
    try {
      const res = await fetchWithAuth(
        `/api/products`,
      );
      if (res.ok) setProducts(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetchWithAuth(
        `/api/products/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: editTitle }),
        }
      );
      if (res.ok) {
        setEditingId(null);
        fetchProducts();
      }
    } catch (e) {
      console.error('Failed to update product', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('products.confirmDelete'))) return;
    try {
      const res = await fetchWithAuth(
        `/api/products/${id}`,
        { method: 'DELETE' }
      );
      if (res.ok) fetchProducts();
    } catch (e) {
      console.error('Failed to delete product', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetchWithAuth(
        `/api/products`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            shopee_url: shopeeUrl || undefined,
            lazada_url: lazadaUrl || undefined,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? 'Failed to add product');
      }

      setShopeeUrl('');
      setLazadaUrl('');
      await fetchProducts();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('products.title')}</h1>
        <p className="text-gray-500 mt-1">
          {t('products.subtitle')}
        </p>
      </div>

      {/* Add Product Form */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">{t('products.addProductComparison')}</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="url"
              value={shopeeUrl}
              onChange={(e) => setShopeeUrl(e.target.value)}
              placeholder={t('products.shopeePlaceholder')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0166E0] focus:ring-1 focus:ring-[#0166E0] transition-colors flex-1"
            />
            <input
              type="url"
              value={lazadaUrl}
              onChange={(e) => setLazadaUrl(e.target.value)}
              placeholder={t('products.lazadaPlaceholder')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0166E0] focus:ring-1 focus:ring-[#0166E0] transition-colors flex-1"
            />
          </div>
          <button
            type="submit"
            disabled={loading || (!shopeeUrl && !lazadaUrl)}
            className="btn-primary self-start disabled:opacity-50 px-6 py-3 rounded-xl"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('products.adding')}
              </span>
            ) : (
              t('products.addProduct')
            )}
          </button>
        </form>
        {error && (
          <p className="mt-3 text-red-500 text-sm font-medium">{error}</p>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">{t('products.trackedProducts')} ({products.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-semibold">{t('products.thProduct')}</th>
                <th className="pb-3 font-semibold">{t('products.thShopeePrice')}</th>
                <th className="pb-3 font-semibold">{t('products.thLazadaPrice')}</th>
                <th className="pb-3 font-semibold">{t('products.thBest')}</th>
                <th className="pb-3 font-semibold">{t('products.thAdded')}</th>
                <th className="pb-3 font-semibold text-right">{t('products.thActions')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const shopeeOffer = product.offers.find(
                  (o) => o.marketplace === 'SHOPEE',
                );
                const lazadaOffer = product.offers.find(
                  (o) => o.marketplace === 'LAZADA',
                );
                const sortedOffers = [...product.offers].sort(
                  (a, b) => Number(a.price) - Number(b.price),
                );
                const bestMarketplace = sortedOffers[0]?.marketplace;

                return (
                  <tr key={product.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                          />
                        )}
                        <div className="flex flex-col min-w-0">
                          {editingId === product.id ? (
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full bg-white border border-[#0166E0] rounded md px-2 py-1 text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0166E0] mb-1 flex-1 text-sm"
                              autoFocus
                            />
                          ) : (
                            <span className="font-medium text-gray-900 truncate max-w-xs block" title={product.title}>
                              {product.title}
                            </span>
                          )}
                          {product.offers[0]?.externalUrl && (
                            <a
                              href={product.offers[0].externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#0166E0] hover:text-brand-600 truncate max-w-xs block mt-1"
                              title={product.offers[0].externalUrl}
                            >
                              {product.offers[0].externalUrl}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      {shopeeOffer ? (
                        <span
                          className={
                            bestMarketplace === 'SHOPEE'
                              ? 'text-emerald-600 font-bold'
                              : 'text-gray-900 font-medium'
                          }
                        >
                          ฿{Number(shopeeOffer.price).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-4">
                      {lazadaOffer ? (
                        <span
                          className={
                            bestMarketplace === 'LAZADA'
                              ? 'text-emerald-600 font-bold'
                              : 'text-gray-900 font-medium'
                          }
                        >
                          ฿{Number(lazadaOffer.price).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-4">
                      {bestMarketplace && (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            bestMarketplace === 'SHOPEE'
                              ? 'bg-[#EE4D2D]/10 text-[#EE4D2D]'
                              : 'bg-[#0B1460]/10 text-[#0B1460]'
                          }`}
                        >
                          {bestMarketplace}
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-sm text-gray-500">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-sm text-right">
                      {editingId === product.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdate(product.id)}
                            className="text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors font-medium border border-transparent hover:border-emerald-200"
                          >
                            {t('common.save')}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors font-medium border border-transparent hover:border-gray-200"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingId(product.id);
                              setEditTitle(product.title);
                            }}
                            className="text-[#0166E0] hover:text-brand-700 px-3 py-1.5 rounded-lg hover:bg-[#0166E0]/10 transition-colors font-medium border border-transparent"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors font-medium border border-transparent"
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    {t('products.noProducts')}
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
