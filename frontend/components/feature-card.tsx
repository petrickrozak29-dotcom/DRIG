import Link from 'next/link';

interface FeatureCardProps {
  title: string;
  description: string;
  href: string;
}

export default function FeatureCard({ title, description, href }: FeatureCardProps) {
  return (
    <Link href={href as any} className="rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400 hover:bg-slate-800/90">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-slate-400">{description}</p>
    </Link>
  );
}
