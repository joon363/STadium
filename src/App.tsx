import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SchoolProvider } from './context/SchoolContext';
import { MobileContainer } from './components/MobileContainer';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { SportDetail } from './pages/SportDetail';
import { StageDetail } from './pages/StageDetail';
import { CampusMap } from './pages/CampusMap';
import { Contact } from './pages/Contact';
import { Admin } from './pages/Admin';

export const App: React.FC = () => {
  return (
    <SchoolProvider>
      <BrowserRouter>
        <Routes>
          {/* Admin Route - PC Widescreen 16:9 Layout */}
          <Route path="/admin" element={<Admin />} />

          {/* Visitor Routes - Mobile 480px Layout */}
          <Route
            path="/*"
            element={
              <MobileContainer>
                <Header />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/stages" element={<StageDetail />} />
                    <Route path="/map" element={<CampusMap />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/:sportKey" element={<SportDetail />} />
                  </Routes>
                </main>
              </MobileContainer>
            }
          />
        </Routes>
      </BrowserRouter>
    </SchoolProvider>
  );
};

export default App;
