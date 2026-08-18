export interface PieSlice {
  /** ASCII slug used to look up the `--series-<slug>` CSS color variable. */
  key: string
  label: string
  amount: number
}

interface CategoryPieChartProps {
  slices: PieSlice[]
}

const SIZE = 200
const RADIUS = 80
const STROKE = 32
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function CategoryPieChart({ slices }: CategoryPieChartProps) {
  const visible = slices.filter((s) => s.amount > 0)
  const total = visible.reduce((sum, s) => sum + s.amount, 0)

  if (total === 0) {
    return <p className="pie-empty">今月の支出はまだありません</p>
  }

  let offset = 0

  return (
    <div className="pie-chart">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="pie-chart-svg" role="img" aria-label="カテゴリ別の支出割合">
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={STROKE}
          />
          {visible.map((slice) => {
            const fraction = slice.amount / total
            const dash = fraction * CIRCUMFERENCE
            const gap = CIRCUMFERENCE - dash
            const circle = (
              <circle
                key={slice.key}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={`var(--series-${slice.key})`}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
              />
            )
            offset += dash
            return circle
          })}
        </g>
      </svg>

      <ul className="pie-legend">
        {visible.map((slice) => (
          <li key={slice.key} className="pie-legend-item">
            <span className="pie-legend-swatch" style={{ background: `var(--series-${slice.key})` }} />
            <span className="pie-legend-label">{slice.label}</span>
            <span className="pie-legend-percent">{Math.round((slice.amount / total) * 100)}%</span>
            <span className="pie-legend-amount">¥{slice.amount.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
