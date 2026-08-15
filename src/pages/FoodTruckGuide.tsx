import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, MapPin, Clock, Utensils, Info, Loader2 } from 'lucide-react';
import { getSupabaseFoodTrucks, FoodTruckItem } from '../lib/supabase';

export const FoodTruckGuide: React.FC = () => {
  const navigate = useNavigate();
  const [trucks, setTrucks] = useState<FoodTruckItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getSupabaseFoodTrucks().then((data) => {
      setTrucks(data);
      setLoading(false);
    });
  }, []);

  const activeTrucks = trucks.filter((t) => t.isActive);

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
            <Truck className="w-5 h-5 text-orange-500" />
            <span>푸드트럭 안내</span>
          </h1>
          <p className="text-xs text-slate-400">STadium 푸드트럭 라인업 및 메뉴 안내</p>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-slate-400 text-xs font-bold bg-slate-900 border border-slate-800 rounded-2xl">
          <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
          <span>푸드트럭 정보를 불러오는 중...</span>
        </div>
      ) : activeTrucks.length === 0 ? (
        <div className="py-16 text-center space-y-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <Info className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-bold text-slate-300">등록된 푸드트럭 정보가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {activeTrucks.map((truck) => (
            <div
              key={truck.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-md hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2.5 bg-slate-800 rounded-xl border border-slate-700 shrink-0">
                  {truck.icon || '🚚'}
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-white">{truck.name}</h3>
                  {truck.operatingHours && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{truck.operatingHours}</span>
                    </p>
                  )}
                </div>
              </div>

              {truck.menuSummary && (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-400">
                    <Utensils className="w-3.5 h-3.5" />
                    <span>대표 메뉴 및 먹거리</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {truck.menuSummary}
                  </p>
                </div>
              )}

              {truck.location && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1 border-t border-slate-800/60 font-bold">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>위치: {truck.location}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
