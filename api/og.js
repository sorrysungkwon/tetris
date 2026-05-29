import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

// Build React-compatible VNodes without JSX (no build step needed)
function h(type, props, ...children) {
  const kids = children.length === 0 ? undefined : children.length === 1 ? children[0] : children;
  return { type, key: null, ref: null, props: { ...props, children: kids }, _owner: null, _store: {} };
}

const PIECE_COLORS = ['#00d8ff','#ffe000','#cc00ff','#00ffaa','#ff2040','#2979ff','#ff8c00'];

// 3×3 block grid for the "G" mark on the left
const GRID_BLOCKS = [
  [1,0,1],
  [1,1,1],
  [1,0,1],
];

export default function handler() {
  return new ImageResponse(
    h('div', {
      style: {
        background: 'linear-gradient(145deg, #060012 0%, #08001a 45%, #040010 100%)',
        width: '100%', height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      },
    },
    // ── Grid background ──────────────────────────────────────────────────────
    h('div', {
      style: {
        position: 'absolute', inset: 0,
        backgroundImage:
          'linear-gradient(rgba(0,200,255,0.04) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(0,200,255,0.04) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      },
    }),
    // ── Nebula glows ─────────────────────────────────────────────────────────
    h('div', { style: { position:'absolute', top:'-80px', left:'60px', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle, rgba(0,200,255,0.07) 0%, transparent 70%)' } }),
    h('div', { style: { position:'absolute', bottom:'-100px', right:'80px', width:'600px', height:'600px', borderRadius:'50%', background:'radial-gradient(circle, rgba(160,0,255,0.06) 0%, transparent 70%)' } }),

    // ── Main content row ─────────────────────────────────────────────────────
    h('div', {
      style: {
        display: 'flex', flexDirection: 'row',
        alignItems: 'center', gap: 80,
        position: 'relative',
      },
    },
    // Left: 3×3 block grid mark
    h('div', {
      style: { display: 'flex', flexDirection: 'column', gap: 10 },
    },
    ...GRID_BLOCKS.map((row, ri) =>
      h('div', { key: ri, style: { display: 'flex', gap: 10 } },
        ...row.map((on, ci) =>
          h('div', {
            key: ci,
            style: {
              width: 80, height: 80,
              borderRadius: 10,
              background: on ? PIECE_COLORS[(ri * 3 + ci) % PIECE_COLORS.length] : 'transparent',
              boxShadow: on ? `0 0 20px ${PIECE_COLORS[(ri * 3 + ci) % PIECE_COLORS.length]}88` : 'none',
              border: on ? 'none' : '1px solid rgba(0,200,255,0.08)',
            },
          })
        )
      )
    )),

    // Right: title + subtitle
    h('div', {
      style: { display: 'flex', flexDirection: 'column', gap: 18 },
    },
    // GLOWTRIS logo
    h('div', {
      style: { display: 'flex', flexDirection: 'row', letterSpacing: '-3px' },
    },
    h('span', {
      style: {
        fontSize: 110, fontWeight: 900, fontFamily: 'monospace',
        color: '#00c8ff',
        textShadow: '0 0 30px rgba(0,200,255,0.9), 0 0 70px rgba(0,200,255,0.4)',
      },
    }, 'GLOW'),
    h('span', {
      style: {
        fontSize: 110, fontWeight: 900, fontFamily: 'monospace',
        color: '#a000ff',
        textShadow: '0 0 30px rgba(160,0,255,0.9), 0 0 70px rgba(160,0,255,0.4)',
      },
    }, 'TRIS'),
    ),
    // Separator line
    h('div', {
      style: {
        height: 2, width: '100%',
        background: 'linear-gradient(90deg, #00c8ff55, #a000ff55)',
      },
    }),
    // Subtitle
    h('div', {
      style: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 26, fontFamily: 'monospace',
        letterSpacing: 4,
        textTransform: 'uppercase',
      },
    }, 'Neon Block Stacking'),
    h('div', {
      style: {
        color: 'rgba(0,200,255,0.6)',
        fontSize: 22, fontFamily: 'monospace',
        letterSpacing: 3,
      },
    }, 'glowtris.vercel.app'),
    ),
    ),
    ),
    { width: 1200, height: 630 }
  );
}
