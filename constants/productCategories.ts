// ─── Shared Product Categories ──────────────────────────────────
// Single source of truth for product categories used in:
// - CategoriesGrid (marketplace filter)
// - Product add/edit forms (category selector)
// - Category-based filtering logic

export const PRODUCT_CATEGORIES = [
    'Hamburguesas',
    'Pizzas',
    'Empanadas',
    'Lomitos',
    'Milanesas',
    'Sushi',
    'Pastas',
    'Carnes',
    'Pescados',
    'Sandwiches',
    'Panchos',
    'Burritos',
    'Tortillas',
    'Tartas',
    'Papas Fritas',
    'Guarniciones',
    'Bebidas',
    'Cafetería',
    'Combos',
    'Desayunos',
    'Helados',
    'Panadería',
    'Picadas',
    'Postres',
    'Promociones',
    'Sin TACC',
    'Vegano',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
