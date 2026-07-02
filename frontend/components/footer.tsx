import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-about">
          <Link href="/" className="footer-brand">FUTURE <span>MAGELANG</span></Link>
          <p>Smart Tourism & Digital City Platform untuk pengalaman menjelajahi Magelang dengan teknologi digital.</p>
        </div>
        <div>
          <h4>Eksplor</h4>
          <Link href="/wisata">Wisata</Link><Link href="/kuliner">Kuliner</Link><Link href="/budaya">Budaya</Link><Link href="/sejarah">Sejarah</Link>
        </div>
        <div>
          <h4>Fitur</h4>
          <Link href="/smart-map">Smart Map</Link><Link href="/smart-magelang">Smart Magelang</Link><Link href="/event">Event</Link>
        </div>
        <div>
          <h4>Bantuan</h4>
          <Link href="/#faq">FAQ</Link>
          <Link href="/community-form">Form Saran/Aduan</Link>
        </div>
        <div className="footer-contact">
          <h4>Kontak</h4>
          <p><MapPin /> Magelang, Jawa Tengah, Indonesia</p>
          <a href="mailto:developermagelang45@gmail.com"><Mail /> developermagelang45@gmail.com</a>
        </div>
      </div>
      <div className="footer-bottom">© 2026 Future Magelang. All rights reserved.</div>
    </footer>
  );
}
