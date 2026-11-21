import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'ZAY Atelier — Mode féminine';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a100c',
          color: '#f5ebe3',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div
          style={{
            fontSize: 96,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            fontWeight: 400,
          }}
        >
          ZAY
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 36,
            fontStyle: 'italic',
            letterSpacing: '0.08em',
            opacity: 0.85,
          }}
        >
          Atelier
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 22,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            opacity: 0.55,
          }}
        >
          Mode féminine
        </div>
      </div>
    ),
    { ...size },
  );
}
