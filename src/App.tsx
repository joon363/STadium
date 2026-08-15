import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SchoolProvider } from './context/SchoolContext';
import { RealtimeScheduleProvider } from './hooks/useRealtimeSchedule';
import { MobileContainer } from './components/MobileContainer';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Loader2 } from 'lucide-react';

// Lazy-loaded route components for optimal bundle splitting
const SportDetail = lazy(() => import('./pages/SportDetail').then((m) => ({ default: m.SportDetail })));
const StageDetail = lazy(() => import('./pages/StageDetail').then((m) => ({ default: m.StageDetail })));
const CampusMap = lazy(() => import('./pages/CampusMap').then((m) => ({ default: m.CampusMap })));
const Contact = lazy(() => import('./pages/Contact').then((m) => ({ default: m.Contact })));
const BoothGuide = lazy(() => import('./pages/BoothGuide').then((m) => ({ default: m.BoothGuide })));
const FoodTruckGuide = lazy(() => import('./pages/FoodTruckGuide').then((m) => ({ default: m.FoodTruckGuide })));
const SponsorGuide = lazy(() => import('./pages/SponsorGuide').then((m) => ({ default: m.SponsorGuide })));
const Admin = lazy(() => import('./pages/Admin').then((m) => ({ default: m.Admin })));

const PageLoadingFallback: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] p-6 text-gray-500">
    <Loader2 className="w-7 h-7 text-postech animate-spin mb-2" />
    <span className="text-xs font-bold text-gray-600">페이지를 불러오는 중...</span>
  </div>
);

const HIDE_HEADER_ROUTES = [
  '/soccer',
  '/baseball',
  '/lol',
  '/badminton',
  '/basketball',
  '/map',
  '/sponsors',
  '/contact',
];

const LayoutWrapper: React.FC = () => {
  const location = useLocation();
  const shouldHideHeader = HIDE_HEADER_ROUTES.includes(location.pathname);

  return (
    <MobileContainer>
      {!shouldHideHeader && <Header />}
      <main className="flex-1 flex flex-col">
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/stages" element={<StageDetail />} />
            <Route path="/map" element={<CampusMap />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/booths" element={<BoothGuide />} />
            <Route path="/foodtrucks" element={<FoodTruckGuide />} />
            <Route path="/sponsors" element={<SponsorGuide />} />
            <Route path="/:sportKey" element={<SportDetail />} />
          </Routes>
        </Suspense>
      </main>
    </MobileContainer>
  );
};

export const App: React.FC = () => {
  return (
    <SchoolProvider>
      <RealtimeScheduleProvider>
        <BrowserRouter>
          <Routes>
            {/* Admin Route - PC Widescreen 16:9 Layout */}
            <Route
              path="/admin"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <Admin />
                </Suspense>
              }
            />

            {/* Visitor Routes - Mobile Layout */}
            <Route path="/*" element={<LayoutWrapper />} />
          </Routes>
        </BrowserRouter>
      </RealtimeScheduleProvider>
    </SchoolProvider>
  );
};

export default App;
