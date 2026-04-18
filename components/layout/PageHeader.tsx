import Link from 'next/link';

export default function PageHeader(props: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="rounded-2xl border bg-white/70 backdrop-blur px-6 py-6 md:px-8 md:py-7">
      {props.eyebrow && (
        <div className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs text-slate-700">
          {props.eyebrow}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{props.title}</h1>
          {props.subtitle && <p className="mt-2 text-muted-foreground">{props.subtitle}</p>}
        </div>
        {props.cta && (
          <Link
            href={props.cta.href}
            className="h-10 inline-flex items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-95"
          >
            {props.cta.label}
          </Link>
        )}
      </div>
    </div>
  );
}

