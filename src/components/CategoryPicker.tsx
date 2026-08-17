import type { Category } from '../types'
import { CATEGORIES } from '../types'

interface CategoryPickerProps {
  value: Category | null
  onChange: (category: Category) => void
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <div className="category-picker">
      {CATEGORIES.map((category) => (
        <button
          key={category}
          type="button"
          className={`category-button${value === category ? ' category-button--selected' : ''}`}
          onClick={() => onChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
