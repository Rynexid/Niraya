import {
  CoffeeIcon,
  CroissantIcon,
  CupSodaIcon,
  SandwichIcon,
  TagIcon,
  type LucideIcon,
} from 'lucide-react'

/**
 * Pick a category icon from its name. The catalog is user-editable, so this
 * keeps the POS pills visual without forcing an icon field on categories.
 */
export function categoryIcon(name: string): LucideIcon {
  const value = name.toLowerCase()

  if (/kopi|coffee|espresso|latte/.test(value)) return CoffeeIcon
  if (/bakery|pastry|roti|bread|croissant|kue|cake/.test(value)) {
    return CroissantIcon
  }
  if (/deli|sandwich|makanan|food|nasi|rice/.test(value)) return SandwichIcon
  if (/minuman|drink|jus|juice|soda|cold/.test(value)) return CupSodaIcon

  return TagIcon
}
