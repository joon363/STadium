import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SchoolProvider } from './context/SchoolContext';
import { MobileContainer } from './components/MobileContainer';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { SportDetail } from './pages/SportDetail';
import { StageDetail } from './pages/StageDetail';
import { CampusMap } from './pages/CampusMap';
import { Contact } from './pages/Contact';
import { BoothGuide } from './pages/BoothGuide';
import { FoodTruckGuide } from './pages/FoodTruckGuide';
import { SponsorGuide } from './pages/SponsorGuide';
import { Admin } from './pages/Admin';

const HIDE_HEADER_ROUTES = ['/soccer', '/baseball', '/lol', '/badminton', '/basketball'];

const LayoutWrapper: React.FC = () => {
  const location = useLocation();
  const shouldHideHeader = HIDE_HEADER_ROUTES.includes(location.pathname);

  return (
    <MobileContainer>
      {!shouldHideHeader && <Header />}
      <main className="flex-1">
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
      </main>
    </MobileContainer>
  );
};

export const App: React.FC = () => {
  return (
    <SchoolProvider>
      <BrowserRouter>
        <Routes>
          {/* Admin Route - PC Widescreen 16:9 Layout */}
          <Route path="/admin" element={<Admin />} />

          {/* Visitor Routes - Mobile Layout */}
          <Route path="/*" element={<LayoutWrapper />} />
        </Routes>
      </BrowserRouter>
    </SchoolProvider>
  );
};

export default App;
