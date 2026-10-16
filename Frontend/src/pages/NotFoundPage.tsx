import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        fontFamily: 'Georgia, "Times New Roman", serif',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      {/* OOPS! PAGE NOT FOUND */}
      <p
        style={{
          letterSpacing: '0.25em',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#111111',
          margin: '0 0 0.5rem',
          textTransform: 'uppercase',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        Oops! Page Not Found
      </p>

      {/* 404 */}
      <h1
        style={{
          fontSize: 'clamp(8rem, 22vw, 16rem)',
          fontWeight: 900,
          lineHeight: 0.9,
          color: '#111111',
          margin: '0 0 1.5rem',
          fontFamily: 'Georgia, "Times New Roman", serif',
          letterSpacing: '-0.02em',
        }}
      >
        404
      </h1>

      {/* Description */}
      <p
        style={{
          letterSpacing: '0.1em',
          fontSize: '0.9rem',
          fontWeight: 700,
          color: '#111111',
          maxWidth: '36rem',
          lineHeight: 1.6,
          margin: '0 0 2.5rem',
          textTransform: 'uppercase',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        We are sorry, but the page you requested was not found
      </p>

      {/* Back to Home button */}
      <Link
        to="/"
        style={{
          display: 'inline-block',
          padding: '0.5rem 1.5rem',
          border: '1px solid #111111',
          color: '#111111',
          textDecoration: 'none',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontFamily: 'Arial, Helvetica, sans-serif',
          transition: 'background-color 0.2s, color 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#111111';
          (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
          (e.currentTarget as HTMLAnchorElement).style.color = '#111111';
        }}
      >
        Back to the Home Page
      </Link>
    </div>
  );
}
