'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslation } from '../lib/i18n/context';
import LanguageSwitcher from '../components/LanguageSwitcher';

interface Product {
  id: string;
  title: string;
  imageUrl: string | null;
  offers: Array<{
    id: string;
    marketplace: 'SHOPEE' | 'LAZADA';
    storeName: string;
    price: number;
    externalUrl: string;
  }>;
  links?: Array<{
    shortCode: string;
    targetUrl: string;
    campaign: { name: string };
  }>;
}

export default function HomePage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}/api/products`,
      { cache: 'no-store' },
    )
      .then((res) => (res.ok ? res.json() : []))
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="relative w-full">
        <div className="bg-gradient-to-b from-[#0166E0]/20 from-10% via-[#FFFFFF] via-30% to-[#FFFFFF]">
          <div className="w-full bg-[length:100%_auto] xl:bg-[length:95%_auto] bg-jenosize-hero bg-top bg-no-repeat min-h-[600px] md:min-h-[800px] flex flex-col">
            <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
              <div className="flex items-center gap-3">
                <img src="/jenosize-logo.svg" alt="Jenosize" className="h-10 md:h-12 drop-shadow-sm" />
              </div>
              <LanguageSwitcher />
            </nav>

            <div className="relative z-10 text-center py-20 md:py-32 px-4 max-w-5xl mx-auto flex-1 flex flex-col justify-center items-center">
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 text-gray-900 tracking-tight leading-tight md:leading-tight">
                <span className="block mb-2 md:mb-4">{t('home.heroLine1')}</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#01BE8C] to-[#04BFB6]">
                  {t('home.heroLine2')}
                </span>
                <span className="block mt-2 md:mt-4">{t('home.heroLine3')}</span>
              </h1>
              <p className="text-lg md:text-2xl text-gray-700 mt-6 max-w-3xl mx-auto font-medium">
                {t('home.heroSubtitle')}
              </p>
              
              <div className="mt-12 flex items-center gap-4 flex-wrap justify-center">
                <a href="#deals" className="btn-primary rounded-full px-8 py-4 text-lg">
                  {t('home.exploreDeals')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Areas with Dot Background */}
      <div className="bg-jenosize-dots bg-top">
        {/* Products Grid */}
        <main id="deals" className="max-w-7xl mx-auto px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#0166E0]">{t('home.whyUsTitle')}</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-16">
              {t('home.whyUsSubtitle')}
            </p>
          </div>

          {products.length === 0 ? (
            <div className="card text-center py-24 max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📦</span>
              </div>
              <p className="text-gray-500 text-lg mb-4">
                {t('home.noProducts')}
              </p>
              <Link href="/admin/products" className="btn-primary inline-flex">
                {t('home.addProductsAdmin')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-12">
              {products.map((product) => {
                const sortedOffers = [...(product.offers ?? [])].sort(
                  (a, b) => a.price - b.price,
                );
                const bestPrice = sortedOffers[0];

                return (
                  <div key={product.id} className="group flex flex-col h-full">
                    {/* Product Image */}
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-6 shadow-md transition-shadow group-hover:shadow-xl bg-gray-100">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          {t('common.noImage')}
                        </div>
                      )}
                      {bestPrice && (
                        <div className="absolute top-4 right-4 badge-best shadow-sm backdrop-blur-md bg-white/95">
                          {t('common.bestPrice')}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col">
                      {/* Product Info */}
                      <h3 className="font-bold text-xl mb-4 text-gray-900 line-clamp-2 leading-snug">
                        {product.title}
                      </h3>

                      {/* Price Comparison */}
                      <div className="space-y-3 mb-6 flex-1">
                        {sortedOffers.map((offer, idx) => (
                          <div
                            key={offer.id}
                            className={`flex items-center justify-between p-3.5 rounded-xl transition-colors ${
                              idx === 0
                                ? 'bg-[#01BE8C]/10 border border-[#01BE8C]/20'
                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-3 h-3 rounded-full shadow-sm ${
                                  offer.marketplace === 'SHOPEE'
                                    ? 'bg-[#EE4D2D]'
                                    : 'bg-[#0B1460]'
                                }`}
                              />
                              <span className="text-sm font-medium text-gray-700">
                                {offer.storeName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-extrabold ${
                                  idx === 0 ? 'text-[#01BE8C]' : 'text-gray-900'
                                }`}
                              >
                                ฿{Number(offer.price).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* CTA Buttons */}
                      <div className="flex gap-3">
                        {sortedOffers.map((offer) => {
                          const trackedLink = product.links?.find(
                            (l) => l.targetUrl === offer.externalUrl,
                          );
                          const finalUrl = trackedLink
                            ? `/go/${trackedLink.shortCode}`
                            : offer.externalUrl;

                          return (
                            <a
                              key={offer.id}
                              href={finalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex-1 text-center py-3 text-sm font-semibold rounded-xl text-white shadow-md transition-transform hover:-translate-y-1 ${
                                offer.marketplace === 'SHOPEE' ? 'bg-[#EE4D2D]' : 'bg-gradient-to-r from-[#0B1460] to-[#0166E0]'
                              }`}
                            >
                              {offer.marketplace === 'SHOPEE'
                                ? t('home.buyShopee')
                                : t('home.buyLazada')}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center">
          <img src="/jenosize-logo.svg" alt="Jenosize" className="h-6 mb-4 opacity-80 mix-blend-multiply grayscale hover:grayscale-0 transition-all" />
          <p className="text-gray-500 text-sm font-medium">{t('common.footerCopyright')}</p>
          <p className="text-gray-400 text-xs mt-1">{t('common.footerBuiltWith')}</p>
        </div>
      </footer>
    </div>
  );
}
