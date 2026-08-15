import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, MapPin, Clock, Info } from 'lucide-react';
import { getSupabaseBooths, BoothItem } from '../lib/supabase';

export const BoothGuide: React.FC = () => {
  const navigate = useNavigate();
  const [booths, setBooths] = useState<BoothItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  useEffect(() => {
    getSupabaseBooths().then((data) => {
      setBooths(data);
      setLoading(false);
    });
  }, []);

  const categories = [
    { id: 'ALL', label: '전체' },
    { id: 'experience', label: '체험 부스' },
    { id: 'food', label: '음식/식음' },
    { id: 'event', label: '이벤트' },
    { id: 'promotion', label: '홍보' },
  ];

  const filteredBooths = activeCategory === 'ALL'
    ? booths.filter((b) => b.isActive)
    : booths.filter((b) => b.isActive && b.category === activeCategory);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 space-y-4 pb-12 select-none">
      {/* Header Bar */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => navigate('/')}
          className="touch-target p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white active:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-extrabold text-base flex items-center gap-2 text-white">
            <Store className="w-5 h-5 text-amber-500" />
            <span>부스 안내</span>
          </h1>
          <p className="text-xs text-slate-400">STadium 행사장 내 체험 및 동아리 부스 목록</p>
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${
              activeCategory === cat.id
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Supabase 데이터 불러오는 중...
        </div>
      ) : filteredBooths.length === 0 ? (
        <div className="py-16 text-center space-y-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <Info className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-bold text-slate-300">등록된 부스 정보가 없습니다.</p>
          <p className="text-xs text-slate-500">관리자 페이지에서 부스 정보를 등록해주세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredBooths.map((booth) => (
            <div
              key={booth.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 shadow-md hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-2 bg-slate-800 rounded-lg border border-slate-700">
                    {booth.icon || '🎪'}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">{booth.name}</h3>
                    {booth.operator && (
                      <p className="text-xs text-amber-400 font-semibold">{booth.operator}</p>
                    )}
                  </div>
                </div>
              </div>

              {booth.description && (
                <p className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  {booth.description}
                </p>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                {booth.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{booth.location}</span>
                  </div>
                )}
                {booth.operatingHours && (
                  <div className="flex items-center gap-1 ml-auto">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{booth.operatingHours}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
