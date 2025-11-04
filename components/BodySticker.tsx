import React, { useState } from 'react';
import {
  // Ícones anatômicos específicos da biblioteca Gi (Game Icons)
  GiBoneKnife,       // Coluna vertebral - osso/espinha
  GiShoulderBag,     // Ombro - bolsa de ombro
  GiElbowPad,        // Cotovelo - proteção de cotovelo
  GiHand,            // Mão/Punho - mão
  GiLegArmor,        // Joelho - proteção de joelho
  GiLeg,             // Membro inferior - perna
  GiPerson,          // Quadril/Outros - representação de pessoa/torso
  GiBarefoot,        // Tornozelo/Pé - pé descalço
  GiBrokenBone       // OA/Problemas - osso quebrado
} from 'react-icons/gi';

const color = (name: string) => ({
  'Coluna': '#10B981',
  'Coluna cervical': '#10B981',
  'Coluna lombar': '#059669',
  'Ombro': '#6366F1',
  'Cotovelo': '#3B82F6',
  'Punho': '#2563EB',
  'Mão': '#1D4ED8',
  'Membro inferior (geral)': '#8B5CF6',
  'Joelho': '#F59E0B',
  'Quadril': '#EC4899',
  'Tornozelo/Pé': '#06B6D4',
  'Joelho/Quadril (OA)': '#F97316',
  'Geral': '#6B7280',
  'Outros': '#6B7280'
}[name] || '#6B7280');

// Mapeamento de categorias para ícones anatômicos específicos
const IconComponents: Record<string, React.ComponentType<any>> = {
  'Coluna': GiBoneKnife,                    // Ícone de coluna vertebral (osso/espinha)
  'Coluna cervical': GiBoneKnife,          // Ícone de coluna vertebral (osso/espinha)
  'Coluna lombar': GiBoneKnife,             // Ícone de coluna vertebral (osso/espinha)
  'Ombro': GiShoulderBag,                   // Ícone de ombro
  'Cotovelo': GiElbowPad,                   // Ícone de cotovelo
  'Punho': GiHand,                          // Ícone de punho (mão)
  'Mão': GiHand,                            // Ícone de mão
  'Membro inferior (geral)': GiLeg,        // Ícone de perna/membro inferior
  'Joelho': GiLegArmor,                     // Ícone de joelho (perneira)
  'Quadril': GiPerson,                      // Ícone de quadril (representação de pessoa/torso)
  'Tornozelo/Pé': GiBarefoot,              // Ícone de pé/tornozelo (pé descalço)
  'Joelho/Quadril (OA)': GiBrokenBone,     // Ícone para OA (osso quebrado)
  'Geral': GiPerson,                        // Ícone genérico de pessoa
  'Outros': GiPerson                        // Ícone genérico de pessoa
};

// Mapeamento de categorias para nomes de arquivos de imagem
const imageMap: Record<string, string> = {
  'Coluna': '/body-stickers/coluna-icon.png',
  'Coluna cervical': '/body-stickers/coluna-cervical-icon.png',
  'Coluna lombar': '/body-stickers/coluna-lombar-icon.png',
  'Ombro': '/body-stickers/ombro-icon.png',
  'Cotovelo': '/body-stickers/cotovelo-icon.png',
  'Punho': '/body-stickers/punho-icon.png',
  'Mão': '/body-stickers/mao-icon.png',
  'Membro inferior (geral)': '/body-stickers/membro-inferior-icon.png',
  'Joelho': '/body-stickers/joelho-icon.png',
  'Quadril': '/body-stickers/quadril-icon.png',
  'Tornozelo/Pé': '/body-stickers/tornozelo-pe-icon.png',
  'Joelho/Quadril (OA)': '/body-stickers/joelho-quadril-oa-icon.png',
  'Geral': '/body-stickers/geral-icon.png',
  'Outros': '/body-stickers/outros-icon.png'
};

const BodySticker: React.FC<{ category: string; size?: number }>= ({ category, size=40 }) => {
  const c = color(category);
  const IconComponent = IconComponents[category] || IconComponents['Outros'];
  const imagePath = imageMap[category] || imageMap['Outros'];
  const [imageError, setImageError] = useState(false);
  
  return (
    <div 
      aria-hidden 
      className="inline-flex items-center justify-center rounded-2xl shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl overflow-hidden"
      style={{ 
        width: size, 
        height: size, 
        color: '#fff', 
        background: `linear-gradient(135deg, ${c} 0%, ${c}dd 50%, ${c}aa 100%)`,
        border: `2px solid ${c}40`,
        minWidth: size,
        minHeight: size,
        padding: `${size * 0.15}px`
      }}
    >
      {/* Tenta carregar imagem primeiro, se falhar usa ícone */}
      {!imageError ? (
        <img 
          src={imagePath}
          alt={category}
          onError={() => setImageError(true)}
          style={{
            width: `${size * 0.7}px`,
            height: `${size * 0.7}px`,
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2)) brightness(0) invert(1)',
            display: 'block'
          }}
        />
      ) : (
        IconComponent && (
          <IconComponent 
            size={Math.floor(size * 0.65)} 
            style={{ 
              color: '#fff',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }} 
          />
        )
      )}
    </div>
  );
};

export default BodySticker;


