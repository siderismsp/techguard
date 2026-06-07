export default function Logo({ size = 28, compact = false }) {
  const scale = size / 100

  if (compact) {
    // Compact version for sidebar — shield icon + TECHGUARD text only
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 52" width={size * 4.5} height={size * 0.85} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="shieldGlowC" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00A3FF" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <g transform={`translate(0, 0) scale(${scale * 0.5})`}>
          <path d="M 50 10 L 85 25 L 85 65 C 85 85 50 100 50 100 C 50 100 15 85 15 65 L 15 25 Z" 
                fill="none" stroke="url(#shieldGlowC)" strokeWidth="4" strokeLinejoin="round" />
          <path d="M 50 22 L 73 32 L 73 60 C 73 74 50 85 50 85 C 50 85 27 74 27 60 L 27 32 Z" 
                fill="#161B22" stroke="#00A3FF" strokeWidth="2" strokeLinejoin="round" opacity="0.8"/>
          <circle cx="50" cy="52" r="6" fill="#10B981" />
          <line x1="50" y1="32" x2="50" y2="46" stroke="#10B981" strokeWidth="2" strokeDasharray="2,2" />
          <line x1="50" y1="58" x2="50" y2="75" stroke="#10B981" strokeWidth="2" />
          <line x1="35" y1="52" x2="44" y2="52" stroke="#00A3FF" strokeWidth="2" />
          <line x1="56" y1="52" x2="65" y2="52" stroke="#00A3FF" strokeWidth="2" />
        </g>
        <text x="65" y="36" fontSize="22" fontWeight="800" fill="#FFFFFF" letterSpacing="1.5" fontFamily="'DM Sans', sans-serif">
          TECH<tspan fill="#00A3FF">GUARD</tspan>
        </text>
      </svg>
    )
  }

  // Full version for landing pages
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 120" width={size * 3.5} height={size * 0.85} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="shieldGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00A3FF" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>

      <g transform={`translate(15, 10) scale(${scale})`}>
        <path d="M 50 10 L 85 25 L 85 65 C 85 85 50 100 50 100 C 50 100 15 85 15 65 L 15 25 Z" 
              fill="none" stroke="url(#shieldGlow)" strokeWidth="3" strokeLinejoin="round" />
        
        <path d="M 50 22 L 73 32 L 73 60 C 73 74 50 85 50 85 C 50 85 27 74 27 60 L 27 32 Z" 
              fill="#161B22" stroke="#00A3FF" strokeWidth="2" strokeLinejoin="round" opacity="0.8"/>
        
        <circle cx="50" cy="52" r="6" fill="#10B981" />
        <line x1="50" y1="32" x2="50" y2="46" stroke="#10B981" strokeWidth="2" strokeDasharray="2,2" />
        <line x1="50" y1="58" x2="50" y2="75" stroke="#10B981" strokeWidth="2" />
        <line x1="35" y1="52" x2="44" y2="52" stroke="#00A3FF" strokeWidth="2" />
        <line x1="56" y1="52" x2="65" y2="52" stroke="#00A3FF" strokeWidth="2" />
      </g>

      <text x="130" y="58" fontSize="34" fontWeight="800" fill="#FFFFFF" letterSpacing="1.5" fontFamily="'DM Sans', sans-serif">
        TECH<tspan fill="#00A3FF">GUARD</tspan>
      </text>

      <text x="132" y="82" fontSize="12" fontWeight="600" fill="#8B949E" letterSpacing="4" fontFamily="'DM Sans', sans-serif">
        PARENTAL DNS FRONTEND
      </text>

      <g transform="translate(132, 92)">
        <rect width="145" height="16" rx="4" fill="#21262D" />
        <circle cx="10" cy="8" r="3" fill="#10B981" />
        <text x="20" y="12" fontSize="9" fontWeight="700" fill="#C9D1D9" letterSpacing="0.5" fontFamily="'DM Sans', sans-serif">TECHNITIUM INTEGRATED</text>
      </g>
    </svg>
  )
}