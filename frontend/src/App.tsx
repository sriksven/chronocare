import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { healthCheck } from './lib/api';

export default function App() {
  const loc = useLocation();
  const [live, setLive] = useState<boolean | null>(null);

  useEffect(() => {
    healthCheck().then(ok => setLive(ok));
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  const navItem = (to: string, label: string) => {
    const active = loc.pathname === to;
    return (
      <Link
        to={to}
        className={`text-sm font-medium tracking-tight transition-colors ${
          active ? 'text-ink' : 'text-muted hover:text-ink'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="sticky top-0 z-30 border-b border-rule bg-bg/80 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-8 h-16 flex items-center justify-between">
          <Link to="/" className="font-serif text-[22px] font-bold tracking-tightest">
            Chrono<span className="text-teal-deep">Care</span>
          </Link>
          <nav className="flex items-center gap-8">
            {navItem('/how', 'How it works')}
            {navItem('/tools', 'Tools')}
            {navItem('/demo', 'Try it')}
            <a
              href="https://github.com/sriksven/chronocare"
              target="_blank"
              rel="noopener"
              className="text-sm font-medium text-muted hover:text-ink transition-colors"
            >
              GitHub ↗
            </a>
            <span
              className={`flex items-center gap-2 text-xs font-medium ${
                live === null ? 'text-muted' : live ? 'text-risk-low' : 'text-risk-high'
              }`}
              title="Live MCP server status"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  live === null
                    ? 'bg-muted'
                    : live
                    ? 'bg-risk-low animate-pulse'
                    : 'bg-risk-high'
                }`}
              />
              {live === null ? 'checking…' : live ? 'live' : 'offline'}
            </span>
          </nav>
        </div>
      </header>

      <main className="flex-1 relative">
        <Outlet />
      </main>

      <footer className="border-t border-rule mt-32">
        <div className="max-w-[1200px] mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="font-serif text-lg font-bold tracking-tightest mb-2">
              Chrono<span className="text-teal-deep">Care</span>
            </div>
            <p className="text-muted text-[13px] max-w-xs">
              Clinical reasoning engine. 13 MCP tools. 8 LLM calls. One unified brief.
            </p>
          </div>
          <div>
            <div className="eyebrow mb-3">Explore</div>
            <ul className="space-y-2 text-[13px]">
              <li><Link to="/how" className="text-ink-2 hover:text-ink">How it works</Link></li>
              <li><Link to="/tools" className="text-ink-2 hover:text-ink">14 MCP tools</Link></li>
              <li><Link to="/demo" className="text-ink-2 hover:text-ink">Live demo</Link></li>
            </ul>
          </div>
          <div>
            <div className="eyebrow mb-3">Source</div>
            <ul className="space-y-2 text-[13px]">
              <li><a href="https://github.com/sriksven/chronocare" target="_blank" rel="noopener" className="text-ink-2 hover:text-ink">GitHub repo ↗</a></li>
              <li><a href="https://attractive-ambition-production-5fd7.up.railway.app/health" target="_blank" rel="noopener" className="text-ink-2 hover:text-ink">Health endpoint ↗</a></li>
              <li><a href="https://attractive-ambition-production-5fd7.up.railway.app/mcp/" target="_blank" rel="noopener" className="text-ink-2 hover:text-ink">MCP endpoint ↗</a></li>
            </ul>
          </div>
          <div>
            <div className="eyebrow mb-3">Built for</div>
            <p className="text-ink-2 text-[13px]">
              Agents Assemble Hackathon, May 2026. Krishna Venkatesh.
            </p>
          </div>
        </div>
        <div className="border-t border-rule">
          <div className="max-w-[1200px] mx-auto px-8 py-5 text-[11px] text-muted tracking-wider">
            DEMO DATA IS FULLY SYNTHETIC. NO PHI.
          </div>
        </div>
      </footer>
    </div>
  );
}
