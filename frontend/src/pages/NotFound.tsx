import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-[760px] mx-auto px-8 py-32">
      <div className="eyebrow mb-6">404</div>
      <h1 className="font-serif text-[56px] md:text-[72px] leading-[0.98] tracking-tightest font-bold mb-6">
        That page doesn't exist.
      </h1>
      <p className="text-[16px] text-ink-2 leading-[1.6] mb-10 max-w-[560px]">
        The URL you followed isn't a route in this app. Pick a destination below.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-[640px]">
        <Link to="/" className="border border-rule bg-paper rounded-sm px-5 py-4 hover:border-teal-deep transition-colors">
          <div className="font-serif text-[18px] font-bold tracking-tighter">Home</div>
          <div className="text-[13px] text-muted mt-1">The pitch in 30 seconds</div>
        </Link>
        <Link to="/how" className="border border-rule bg-paper rounded-sm px-5 py-4 hover:border-teal-deep transition-colors">
          <div className="font-serif text-[18px] font-bold tracking-tighter">How it works</div>
          <div className="text-[13px] text-muted mt-1">Architecture, tools, admin flow</div>
        </Link>
        <Link to="/demo" className="border border-rule bg-paper rounded-sm px-5 py-4 hover:border-teal-deep transition-colors">
          <div className="font-serif text-[18px] font-bold tracking-tighter">Live demo</div>
          <div className="text-[13px] text-muted mt-1">Run the full pipeline on a patient</div>
        </Link>
        <Link to="/admin" className="border border-rule bg-paper rounded-sm px-5 py-4 hover:border-teal-deep transition-colors">
          <div className="font-serif text-[18px] font-bold tracking-tighter">Admin</div>
          <div className="text-[13px] text-muted mt-1">Add a new patient bundle</div>
        </Link>
      </div>
    </div>
  );
}
