import React from 'react';
import { 
  FaHandPointer,     // Punho
  FaRunning,         // Joelho/Membro inferior
  FaShoePrints,      // Tornozelo/Pé
  FaUserMd,          // Outros (médico)
  FaWheelchair       // OA/Mobilidade
} from 'react-icons/fa';
import {
  GiBoneKnife,       // Coluna
  GiShoulderBag,      // Ombro
  GiElbowPad,        // Cotovelo
  GiHand,            // Mão
  GiBarefoot,        // Pé
  GiLegArmor,        // Joelho
  GiPerson           // Membro inferior/Corpo
} from 'react-icons/gi';
import {
  MdHealthAndSafety, // Saúde/Outros
  MdSick,            // OA
  MdAccessibility    // Quadril
} from 'react-icons/md';

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

// Mapeamento de categorias para ícones web
const IconComponents: Record<string, React.ComponentType<any>> = {
  'Coluna': GiBoneKnife,
  'Ombro': GiShoulderBag,
  'Cotovelo': GiElbowPad,
  'Punho': FaHandPointer,
  'Mão': GiHand,
  'Membro inferior (geral)': FaRunning,
  'Joelho': GiLegArmor,
  'Quadril': MdAccessibility,
  'Tornozelo/Pé': GiBarefoot,
  'Joelho/Quadril (OA)': MdSick,
  'Outros': MdHealthAndSafety
};

const BodySticker: React.FC<{ category: string; size?: number }>= ({ category, size=40 }) => {
  const c = color(category);
  const IconComponent = IconComponents[category] || IconComponents['Outros'];
  
  return (
    <div 
      aria-hidden 
      className="inline-flex items-center justify-center rounded-xl shadow-md transition-transform hover:scale-105"
      style={{ 
        width: size, 
        height: size, 
        color: '#fff', 
        background: `linear-gradient(135deg, ${c} 0%, #111827 120%)`,
        minWidth: size,
        minHeight: size
      }}
    >
      {IconComponent && <IconComponent size={Math.floor(size * 0.6)} style={{ color: '#fff' }} />}
    </div>
  );
};

export default BodySticker;


