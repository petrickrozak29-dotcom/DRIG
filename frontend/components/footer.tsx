import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 md:grid-cols-4 mb-8">
          <div>
            <h3 className="font-semibold text-white mb-4">MAGELANGVERSE.ID</h3>
            <p className="text-sm text-slate-400">Smart Tourism & Digital City Portal</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Eksplor</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/wisata" className="hover:text-cyan-400">Wisata</Link></li>
              <li><Link href="/kuliner" className="hover:text-cyan-400">Kuliner</Link></li>
              <li><Link href="/budaya" className="hover:text-cyan-400">Budaya</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Fitur</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/smart-map" className="hover:text-cyan-400">Smart Map</Link></li>
              <li><Link href="/ai-assistant" className="hover:text-cyan-400">AI Assistant</Link></li>
              <li><Link href="/event" className="hover:text-cyan-400">Event</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Connect</h4>
            <p className="text-sm text-slate-400">Kota Magelang, Jawa Tengah</p>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
          <p>© 2026 MAGELANGVERSE.ID. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
