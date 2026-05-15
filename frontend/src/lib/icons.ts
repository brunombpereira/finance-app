import {
  Banknote,
  BookOpen,
  Briefcase,
  Bus,
  Car,
  Coffee,
  CreditCard,
  Dumbbell,
  Gamepad2,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Landmark,
  PiggyBank,
  Plane,
  PlusCircle,
  Shirt,
  ShoppingBag,
  Smartphone,
  Tag,
  Utensils,
  Wallet,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Keys are stored on the backend Category.Icon / Account.Icon field.
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  wallet: Wallet,
  'plus-circle': PlusCircle,
  banknote: Banknote,
  briefcase: Briefcase,
  utensils: Utensils,
  coffee: Coffee,
  home: Home,
  zap: Zap,
  car: Car,
  bus: Bus,
  plane: Plane,
  gamepad: Gamepad2,
  heart: Heart,
  dumbbell: Dumbbell,
  'shopping-bag': ShoppingBag,
  shirt: Shirt,
  smartphone: Smartphone,
  gift: Gift,
  book: BookOpen,
  'graduation-cap': GraduationCap,
  'piggy-bank': PiggyBank,
  landmark: Landmark,
  'credit-card': CreditCard,
  tag: Tag,
}

export const ICON_KEYS = Object.keys(CATEGORY_ICONS)

export const FALLBACK_ICON: LucideIcon = Tag
