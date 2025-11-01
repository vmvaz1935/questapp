import React from 'react';
import { 
  HiOutlineSparkles,  // Coluna - símbolo de energia/força
  HiOutlineAcademicCap, // Ombro - representação de força/suporte
  HiOutlineBeaker,    // Cotovelo - representação técnica
  HiOutlineCube,      // Punho/Mão - estrutura sólida
  HiOutlineCubeTransparent, // Mão - estrutura delicada
  HiOutlineBolt,     // Membro inferior - movimento/power
  HiOutlineFire,      // Joelho - energia/movimento
  HiOutlineHeart,     // Quadril - central/core
  HiOutlineGlobeAlt,  // Tornozelo/Pé - conexão com solo
  HiOutlineExclamationTriangle, // OA - atenção/cuidado
  HiOutlineUser      // Outros - genérico
} from 'react-icons/hi2';

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

// Mapeamento de categorias para ícones modernos
const IconComponents: Record<string, React.ComponentType<any>> = {
  'Coluna': HiOutlineSparkles,           // Energia e vitalidade da coluna
  'Ombro': HiOutlineAcademicCap,          // Força e suporte do ombro
  'Cotovelo': HiOutlineBeaker,            // Precisão técnica do cotovelo
  'Punho': HiOutlineCube,                  // Estrutura sólida do punho
  'Mão': HiOutlineCubeTransparent,         // Precisão e delicadeza da mão
  'Membro inferior (geral)': HiOutlineBolt, // Movimento e potência
  'Joelho': HiOutlineFire,                 // Energia e flexibilidade do joelho
  'Quadril': HiOutlineHeart,              // Centro/core do corpo
  'Tornozelo/Pé': HiOutlineGlobeAlt,      // Base e conexão
  'Joelho/Quadril (OA)': HiOutlineExclamationTriangle, // Atenção/cuidado para OA
  'Outros': HiOutlineUser                  // Ícone genérico
};

const BodySticker: React.FC<{ category: string; size?: number }>= ({ category, size=40 }) => {
  const c = color(category);
  const IconComponent = IconComponents[category] || IconComponents['Outros'];
  
  return (
    <div 
      aria-hidden 
      className="inline-flex items-center justify-center rounded-2xl shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
      style={{ 
        width: size, 
        height: size, 
        color: '#fff', 
        background: `linear-gradient(135deg, ${c} 0%, ${c}dd 50%, ${c}aa 100%)`,
        border: `2px solid ${c}40`,
        minWidth: size,
        minHeight: size
      }}
    >
      {IconComponent && (
        <IconComponent 
          size={Math.floor(size * 0.55)} 
          style={{ 
            color: '#fff',
            strokeWidth: 2
          }} 
        />
      )}
    </div>
  );
};

export default BodySticker;


