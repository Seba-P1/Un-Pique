// Food Delivery Categories - Un Pique
// Based on SVG files in /public folder

export const DELIVERY_CATEGORIES = [
    { id: 'hamburguesas', name: 'Hamburguesas', icon: '🍔', svg: 'hamburguesas.svg' },
    { id: 'pizzas', name: 'Pizzas', icon: '🍕', svg: 'pizzas.svg' },
    { id: 'empanadas', name: 'Empanadas', icon: '🥟', svg: 'empanadas.svg' },
    { id: 'lomitos', name: 'Lomitos', icon: '🥙', svg: 'lomitos.svg' },
    { id: 'milanesas', name: 'Milanesas', icon: '🍗', svg: 'milanesas.svg' },
    { id: 'sushi', name: 'Sushi', icon: '🍣', svg: 'sushi.svg' },
    { id: 'pastas', name: 'Pastas', icon: '🍝', svg: 'pastas.svg' },
    { id: 'carnes', name: 'Carnes', icon: '🥩', svg: 'carnes.svg' },
    { id: 'pescados', name: 'Pescados', icon: '🐟', svg: 'pescados.svg' },
    { id: 'sandwiches', name: 'Sandwiches', icon: '🥪', svg: 'sandwiches.svg' },
    { id: 'panchos', name: 'Panchos', icon: '🌭', svg: 'panchos.svg' },
    { id: 'burritos', name: 'Burritos', icon: '🌯', svg: 'burritos.svg' },
    { id: 'tortillas', name: 'Tortillas', icon: '🫓', svg: 'tortillas.svg' },
    { id: 'tartas', name: 'Tartas', icon: '🥧', svg: 'tartas.svg' },
    { id: 'papas_fritas', name: 'Papas Fritas', icon: '🍟', svg: 'papas fritas.svg' },
    { id: 'guarniciones', name: 'Guarniciones', icon: '🥗', svg: 'guarniciones.svg' },
    { id: 'picadas', name: 'Picadas', icon: '🧀', svg: 'picadas.svg' },
    { id: 'combos', name: 'Combos', icon: '🍱', svg: 'combos.svg' },
    { id: 'desayunos', name: 'Desayunos', icon: '🥐', svg: 'desayunos.svg' },
    { id: 'panaderia', name: 'Panadería', icon: '🥖', svg: 'panaderia.svg' },
    { id: 'postres', name: 'Postres', icon: '🍰', svg: 'postres.svg' },
    { id: 'helados', name: 'Helados', icon: '🍦', svg: 'helados.svg' },
    { id: 'cafeteria', name: 'Cafetería', icon: '☕', svg: 'cafeteria.svg' },
    { id: 'bebidas', name: 'Bebidas', icon: '🥤', svg: 'bebidas.svg' },
    { id: 'vegano', name: 'Vegano', icon: '🥬', svg: 'vegano.svg' },
    { id: 'sin_tacc', name: 'Sin TACC', icon: '🌾', svg: 'sin-tacc.svg' },
    { id: 'promociones', name: 'Promociones', icon: '🎁', svg: 'promociones.svg' },
] as const;

export type DeliveryCategoryId = typeof DELIVERY_CATEGORIES[number]['id'];

// Helper to get category by ID
export const getCategoryById = (id: string) =>
    DELIVERY_CATEGORIES.find(cat => cat.id === id);

// Helper to get category name
export const getCategoryName = (id: string) =>
    getCategoryById(id)?.name || id;
