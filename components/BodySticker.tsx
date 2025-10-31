import React from 'react';

const color = (name: string) => ({
  'Coluna': '#10B981',
  'Ombro': '#6366F1',
  'Cotovelo': '#3B82F6',
  'Punho': '#2563EB',
  'Mão': '#1D4ED8',
  'Membro inferior (geral)': '#8B5CF6',
  'Joelho': '#F59E0B',
  'Quadril': '#EC4899',
  'Tornozelo/Pé': '#06B6D4',
  'Joelho/Quadril (OA)': '#F97316',
  'Outros': '#6B7280'
}[name] || '#6B7280');

// Ícones anatômicos em SVG (stickers) por categoria - estilo realista
const SVGs: Record<string, JSX.Element> = {
  'Coluna': (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      {/* Coluna vertebral vista de lado */}
      <path d="M12 2 Q13 4 12 6 Q11 8 12 10 Q13 12 12 14 Q11 16 12 18 Q13 20 12 22" 
        stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <circle cx="11.5" cy="4" r="1.2" fill="currentColor"/>
      <circle cx="12.5" cy="6" r="1" fill="currentColor"/>
      <circle cx="11.5" cy="8" r="1.2" fill="currentColor"/>
      <circle cx="12.5" cy="10" r="1" fill="currentColor"/>
      <circle cx="11.5" cy="12" r="1.2" fill="currentColor"/>
      <circle cx="12.5" cy="14" r="1" fill="currentColor"/>
      <circle cx="11.5" cy="16" r="1.2" fill="currentColor"/>
      <circle cx="12.5" cy="18" r="1" fill="currentColor"/>
      <circle cx="11.5" cy="20" r="1.2" fill="currentColor"/>
    </svg>
  ),
  'Ombro': (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      {/* Ombro e braço */}
      <circle cx="6" cy="6" r="4" fill="currentColor" opacity="0.9"/>
      <circle cx="6" cy="6" r="2.5" fill="white" opacity="0.7"/>
      {/* Braço superior */}
      <rect x="4" y="8" width="4" height="10" rx="2" fill="currentColor" opacity="0.8"/>
      {/* Clavícula/linha do ombro */}
      <path d="M2 5 Q6 6 10 5" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6"/>
    </svg>
  ),
  'Cotovelo': (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      {/* Braço superior */}
      <rect x="4" y="3" width="4" height="8" rx="2" fill="currentColor" opacity="0.8"/>
      {/* Articulação do cotovelo (destaque) */}
      <circle cx="6" cy="11" r="3.5" fill="currentColor"/>
      <circle cx="6" cy="11" r="2" fill="white" opacity="0.7"/>
      {/* Antebraço dobrado */}
      <path d="M6 14.5 Q8 17 10 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none"/>
      {/* Ombro */}
      <circle cx="6" cy="3" r="2" fill="currentColor" opacity="0.6"/>
    </svg>
  ),
  'Punho': (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      {/* Antebraço */}
      <rect x="6" y="4" width="3" height="10" rx="1.5" fill="currentColor"/>
      {/* Punho/articulação */}
      <rect x="5.5" y="12" width="4" height="2.5" rx="1" fill="currentColor" opacity="0.9"/>
      <circle cx="8" cy="13.25" r="1" fill="white" opacity="0.8"/>
      {/* Mão */}
      <rect x="6" y="14.5" width="4" height="6" rx="1" fill="currentColor" opacity="0.7"/>
      {/* Dedos */}
      <path d="M7 14.5v5M8 14.5v5M9 14.5v5" stroke="white" strokeWidth="0.8" opacity="0.6"/>
    </svg>
  ),
  'Mão': (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      {/* Palma da mão (forma mais realista) */}
      <ellipse cx="12" cy="12" rx="4" ry="5" fill="currentColor" opacity="0.9"/>
      {/* Polegar */}
      <ellipse cx="7" cy="11" rx="2" ry="3" fill="currentColor" opacity="0.85" transform="rotate(-25 7 11)"/>
      {/* Dedos */}
      <ellipse cx="10" cy="8" rx="1.5" ry="4" fill="currentColor"/>
      <ellipse cx="12.5" cy="8" rx="1.5" ry="4" fill="currentColor"/>
      <ellipse cx="15" cy="8" rx="1.5" ry="4" fill="currentColor"/>
      <ellipse cx="17.5" cy="9" rx="1.2" ry="3.5" fill="currentColor"/>
      {/* Linhas da palma */}
      <path d="M10 12h4M9 14h3" stroke="white" strokeWidth="0.8" opacity="0.6" strokeLinecap="round"/>
    </svg>
  ),
  'Membro inferior (geral)': (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      {/* Coxa */}
      <rect x="10" y="3" width="4" height="6" rx="2" fill="currentColor"/>
      {/* Joelho */}
      <circle cx="12" cy="9" r="2.5" fill="currentColor" opacity="0.9"/>
      <circle cx="12" cy="9" r="1.2" fill="white" opacity="0.7"/>
      {/* Perna */}
      <rect x="10.5" y="11" width="3" height="8" rx="1.5" fill="currentColor"/>
      {/* Tornozelo */}
      <rect x="10" y="18" width="4" height="2" rx="1" fill="currentColor" opacity="0.9"/>
      {/* Pé */}
      <ellipse cx="14" cy="20" rx="2" ry="1.5" fill="currentColor" opacity="0.7"/>
    </svg>
  ),
  'Joelho': (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      {/* Coxa */}
      <rect x="9" y="2" width="6" height="7" rx="3" fill="currentColor" opacity="0.8"/>
      {/* Articulação do joelho (vista frontal) */}
      <circle cx="12" cy="10" r="4" fill="currentColor"/>
      <circle cx="12" cy="10" r="2.5" fill="white" opacity="0.6"/>
      <circle cx="11" cy="9" r="0.8" fill="white" opacity="0.8"/>
      <circle cx="13" cy="9" r="0.8" fill="white" opacity="0.8"/>
      {/* Perna */}
      <rect x="9.5" y="14" width="5" height="7" rx="2.5" fill="currentColor" opacity="0.8"/>
    </svg>
  ),
  'Quadril': (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      {/* Pelve */}
      <ellipse cx="12" cy="7" rx="5" ry="3" fill="currentColor" opacity="0.8"/>
      {/* Articulação do quadril esquerdo */}
      <circle cx="8" cy="8" r="2.5" fill="currentColor"/>
      <circle cx="8" cy="8" r="1.2" fill="white" opacity="0.7"/>
      {/* Articulação do quadril direito */}
      <circle cx="16" cy="8" r="2.5" fill="currentColor"/>
      <circle cx="16" cy="8" r="1.2" fill="white" opacity="0.7"/>
      {/* Coxas */}
      <rect x="7" y="10" width="2" height="10" rx="1" fill="currentColor" opacity="0.7"/>
      <rect x="15" y="10" width="2" height="10" rx="1" fill="currentColor" opacity="0.7"/>
    </svg>
  ),
  'Tornozelo/Pé': (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      {/* Perna */}
      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" opacity="0.8"/>
      {/* Tornozelo/articulação */}
      <circle cx="12" cy="14" r="3" fill="currentColor"/>
      <circle cx="12" cy="14" r="1.5" fill="white" opacity="0.7"/>
      {/* Pé */}
      <ellipse cx="15" cy="18" rx="4" ry="2.5" fill="currentColor" opacity="0.9"/>
      {/* Dedos do pé */}
      <path d="M13 18l1-1M14.5 18l1-1M16 18l1-1" stroke="white" strokeWidth="1" opacity="0.6" strokeLinecap="round"/>
    </svg>
  ),
  'Joelho/Quadril (OA)': (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      {/* Quadril */}
      <ellipse cx="12" cy="6" rx="4" ry="2.5" fill="currentColor" opacity="0.8"/>
      <circle cx="10" cy="7" r="1.8" fill="currentColor"/>
      <circle cx="14" cy="7" r="1.8" fill="currentColor"/>
      {/* Joelho */}
      <circle cx="12" cy="12" r="3.5" fill="currentColor"/>
      <circle cx="12" cy="12" r="2" fill="white" opacity="0.6"/>
      {/* Perna */}
      <rect x="10.5" y="15" width="3" height="6" rx="1.5" fill="currentColor" opacity="0.8"/>
    </svg>
  ),
  'Outros': (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      {/* Símbolo genérico - silhueta humana */}
      <circle cx="12" cy="5" r="2.5" fill="currentColor"/>
      <path d="M12 7.5v6M9 10l3-3 3 3M9 16l3 3 3-3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  )
};

const BodySticker: React.FC<{ category: string; size?: number }>= ({ category, size=40 }) => {
  const c = color(category);
  const Icon = SVGs[category] || SVGs['Outros'];
  return (
    <div aria-hidden className="inline-flex items-center justify-center rounded-xl shadow-md"
      style={{ width: size, height: size, color: '#fff', background: `linear-gradient(135deg, ${c} 0%, #111827 120%)` }}>
      {Icon}
    </div>
  );
};

export default BodySticker;


