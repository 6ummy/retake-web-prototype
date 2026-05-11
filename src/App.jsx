import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import InviterPage from './features/inviter/InviterPage.jsx';
import InviteePage from './features/invitee/InviteePage.jsx';
import usePreventBrowserZoom from './hooks/usePreventBrowserZoom.js';
import { getAppBasePath } from './lib/routes.js';

export default function App() {
  usePreventBrowserZoom();

  return (
    <BrowserRouter basename={getAppBasePath() || undefined}>
      <Routes>
        {/* /inviter — frame creator (beta prototype entry point) */}
        <Route path="/inviter" element={<InviterPage />} />
        {/* /invite/:requestId — public shared-link invitee flow */}
        <Route path="/invite/:requestId" element={<InviteePage />} />
        {/* /invite — empty public invite route, used when a shared link is incomplete */}
        <Route path="/invite" element={<InviteePage />} />
        {/* /invitee — invitee camera view */}
        <Route path="/invitee" element={<InviteePage />} />
        {/* Legacy root → redirect to /inviter for local dev convenience */}
        <Route path="/" element={<InviterPage />} />
      </Routes>
    </BrowserRouter>
  );
}
