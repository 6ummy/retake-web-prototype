import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import InviterPage from './features/inviter/InviterPage.jsx';
import usePreventBrowserZoom from './hooks/usePreventBrowserZoom.js';
import { getAppBasePath } from './lib/routes.js';

export default function App() {
  usePreventBrowserZoom();

  return (
    <BrowserRouter basename={getAppBasePath() || undefined}>
      <Routes>
        {/* /inviter — frame creator (beta prototype entry point) */}
        <Route path="/inviter" element={<InviterPage />} />
        {/* Legacy root → redirect to /inviter for local dev convenience */}
        <Route path="/" element={<InviterPage />} />
        <Route path="*" element={<InviterPage />} />
      </Routes>
    </BrowserRouter>
  );
}
