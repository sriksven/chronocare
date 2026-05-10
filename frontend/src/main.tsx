import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Landing from './pages/Landing';
import HowItWorks from './pages/HowItWorks';
import Demo from './pages/Demo';
import Admin from './pages/Admin';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<App />}>
          <Route path="/" element={<Landing />} />
          <Route path="/how" element={<HowItWorks />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
