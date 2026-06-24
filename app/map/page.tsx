import WorldMap from '../../components/WorldMap';

export default function MapPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '32px clamp(16px, 4vw, 48px) 48px',
        background: 'linear-gradient(180deg, #07111e 0%, #030712 100%)',
        color: '#e2e8f0',
      }}
    >
      <section style={{ maxWidth: 1440, margin: '0 auto', display: 'grid', gap: 24 }}>
        <header style={{ display: 'grid', gap: 12, maxWidth: 860 }}>
          <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#93c5fd' }}>
            Nuclear Command Centers
          </p>
          <h1 style={{ margin: 0, fontSize: 'clamp(2.3rem, 4vw, 4.2rem)', lineHeight: 1.02 }}>
            A globe view for reactor command centers.
          </h1>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: '#cbd5e1', maxWidth: 760 }}>
            We are keeping your reactor dataset intact, but projecting the locations onto a rotating globe so the
            distribution feels closer to the globe.gl example instead of a flat map.
          </p>
        </header>

        <WorldMap />
      </section>
    </main>
  );
}
