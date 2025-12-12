import React, { useMemo } from 'react';

export interface EvolutionDataPoint {
  date: string;
  dateTime: number;
  score: number;
  percent: number;
  index: number;
}

interface EvolutionChartProps {
  data: EvolutionDataPoint[];
  width?: number;
  height?: number;
  showGrid?: boolean;
  showPoints?: boolean;
  color?: string;
  label?: string;
}

/**
 * Componente de gráfico de linha para evolução temporal
 */
export const EvolutionChart: React.FC<EvolutionChartProps> = ({
  data,
  width = 800,
  height = 400,
  showGrid = true,
  showPoints = true,
  color = '#2563EB',
  label = 'Evolução',
}) => {
  const padding = { top: 30, right: 50, bottom: 60, left: 70 };

  const chartData = useMemo(() => {
    if (data.length === 0) return null;

    const minX = Math.min(...data.map(d => d.dateTime));
    const maxX = Math.max(...data.map(d => d.dateTime));
    const rangeX = maxX - minX || 1;
    
    const minY = 0;
    const maxY = 100;
    const rangeY = maxY - minY || 1;

    return {
      minX,
      maxX,
      rangeX,
      minY,
      maxY,
      rangeY,
      points: data.map((d) => {
        const x = padding.left + ((d.dateTime - minX) / rangeX) * (width - padding.left - padding.right);
        const y = padding.top + (height - padding.top - padding.bottom) - ((d.percent - minY) / rangeY) * (height - padding.top - padding.bottom);
        return { ...d, x, y };
      }),
    };
  }, [data, width, height, padding]);

  if (!chartData || chartData.points.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <p>Nenhum dado disponível para exibir</p>
      </div>
    );
  }

  const pathData = chartData.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const gridLines = [0, 25, 50, 75, 100];

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto"
        aria-label={label}
      >
        {/* Grade horizontal */}
        {showGrid &&
          gridLines.map((val) => {
            const y =
              padding.top +
              (height - padding.top - padding.bottom) -
              ((val - chartData.minY) / chartData.rangeY) * (height - padding.top - padding.bottom);
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  className="dark:stroke-gray-700"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#6B7280"
                  className="dark:fill-gray-400"
                >
                  {val}%
                </text>
              </g>
            );
          })}

        {/* Eixos */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#6B7280"
          strokeWidth="2"
          className="dark:stroke-gray-500"
        />
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#6B7280"
          strokeWidth="2"
          className="dark:stroke-gray-500"
        />

        {/* Linha do gráfico */}
        {chartData.points.length > 1 && (
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Área sob a curva (opcional) */}
        {chartData.points.length > 1 && (
          <path
            d={`${pathData} L ${chartData.points[chartData.points.length - 1].x} ${height - padding.bottom} L ${chartData.points[0].x} ${height - padding.bottom} Z`}
            fill={color}
            fillOpacity="0.1"
          />
        )}

        {/* Pontos do gráfico */}
        {showPoints &&
          chartData.points.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill={color}
                stroke="#fff"
                strokeWidth="2"
                className="dark:stroke-gray-800"
              />
              {/* Tooltip hover */}
              <title>{`${point.date}: ${point.percent.toFixed(2)}% (${point.score.toFixed(2)})`}</title>
            </g>
          ))}

        {/* Labels do eixo X (datas) */}
        {chartData.points.map((point, i) => {
          // Mostrar apenas algumas datas para não sobrecarregar
          const showLabel = i === 0 || i === chartData.points.length - 1 || i % Math.ceil(chartData.points.length / 5) === 0;
          if (!showLabel) return null;

          return (
            <text
              key={i}
              x={point.x}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              fontSize="10"
              fill="#6B7280"
              className="dark:fill-gray-400"
              transform={`rotate(-45 ${point.x} ${height - padding.bottom + 20})`}
            >
              {point.date}
            </text>
          );
        })}

        {/* Label do eixo Y */}
        <text
          x={20}
          y={height / 2}
          textAnchor="middle"
          fontSize="12"
          fill="#6B7280"
          className="dark:fill-gray-400"
          transform={`rotate(-90 20 ${height / 2})`}
        >
          Pontuação (%)
        </text>
      </svg>
    </div>
  );
};

export default EvolutionChart;

