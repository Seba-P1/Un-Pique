// constants/navConfig.ts
// Configuración de navegación contextual — Un Pique
// Solo usa lucide-react-native (ya instalada en el proyecto)

import {
  House,
  ShoppingBasket,
  Tag,
  ClipboardList,
  CircleUser,
  Receipt,
  Award,
  Grid2X2,
  Settings,
  PlusCircle,
} from 'lucide-react-native';
import React from 'react';

export type NavContext = 'home' | 'marketplace' | 'servicios' | 'social' | 'profile';

export interface NavItem {
  key: string;
  label: string;
  route: string;
  Icon: React.ComponentType<any>;
  isSpecial?: boolean; // true = botón "+" central naranja
}

export const NAV_CONTEXTS: Record<NavContext, NavItem[]> = {
  // ─── HOME ─────────────────────────────────────────────────────
  home: [
    { key: 'index',       label: 'Inicio',      route: '/(tabs)/',           Icon: House },
    { key: 'marketplace', label: 'Sabor Local', route: '/(tabs)/marketplace', Icon: ShoppingBasket },
    { key: 'servicios',   label: 'Servicios',   route: '/(tabs)/servicios',  Icon: Tag },
    { key: 'social',      label: 'Social',      route: '/(tabs)/social',     Icon: ClipboardList },
    { key: 'profile',     label: 'Mi Perfil',   route: '/(tabs)/profile',    Icon: CircleUser },
  ],

  // ─── SABOR LOCAL ──────────────────────────────────────────────
  // "Mis Pedidos" en el centro — acceso rápido a pedidos activos
  marketplace: [
    { key: 'index',       label: 'Inicio',      route: '/(tabs)/',           Icon: House },
    { key: 'marketplace', label: 'Sabor Local', route: '/(tabs)/marketplace', Icon: ShoppingBasket },
    { key: 'pedidos',     label: 'Mis Pedidos', route: '/orders',            Icon: Receipt },
    { key: 'social',      label: 'Social',      route: '/(tabs)/social',     Icon: ClipboardList },
    { key: 'profile',     label: 'Mi Perfil',   route: '/(tabs)/profile',    Icon: CircleUser },
  ],

  // ─── SERVICIOS ────────────────────────────────────────────────
  // Nav estándar — misma que home
  servicios: [
    { key: 'index',       label: 'Inicio',      route: '/(tabs)/',           Icon: House },
    { key: 'marketplace', label: 'Sabor Local', route: '/(tabs)/marketplace', Icon: ShoppingBasket },
    { key: 'servicios',   label: 'Servicios',   route: '/(tabs)/servicios',  Icon: Tag },
    { key: 'social',      label: 'Social',      route: '/(tabs)/social',     Icon: ClipboardList },
    { key: 'profile',     label: 'Mi Perfil',   route: '/(tabs)/profile',    Icon: CircleUser },
  ],

  // ─── SOCIAL ───────────────────────────────────────────────────
  // El FAB flotante se mueve al centro del tab bar
  // route '__create_post__' es una señal especial — no navega, llama onCreatePost()
  social: [
    { key: 'index',       label: 'Inicio',      route: '/(tabs)/',           Icon: House },
    { key: 'marketplace', label: 'Sabor Local', route: '/(tabs)/marketplace', Icon: ShoppingBasket },
    { key: 'create_post', label: 'Publicar',    route: '__create_post__',    Icon: PlusCircle, isSpecial: true },
    { key: 'social',      label: 'Social',      route: '/(tabs)/social',     Icon: ClipboardList },
    { key: 'profile',     label: 'Mi Perfil',   route: '/(tabs)/profile',    Icon: CircleUser },
  ],

  // ─── MI PERFIL ────────────────────────────────────────────────
  // Acceso a Club UP, publicaciones, configuración y botón "+"
  profile: [
    { key: 'index',           label: 'Inicio',           route: '/(tabs)/',     Icon: House },
    { key: 'loyalty',         label: 'Club UP',          route: '/loyalty',     Icon: Award },
    { key: 'create_post',     label: 'Publicar',         route: '__create_post__', Icon: PlusCircle, isSpecial: true },
    { key: 'my-listings',     label: 'Mis Public.',      route: '/my-listings', Icon: Grid2X2 },
    { key: 'settings',        label: 'Configuración',    route: '/settings',    Icon: Settings },
  ],
};

/**
 * Detecta el contexto de navegación activo.
 * Usa el segmento del tab raíz (useSegments de Expo Router), NO el pathname completo.
 * Esto es correcto: si estás en /shop/sanguchito-tito (dentro de marketplace),
 * el tab activo sigue siendo 'marketplace' y el contexto no cambia.
 *
 * Uso:
 *   const segments = useSegments();
 *   const activeTab = segments[1] ?? 'index'; // '(tabs)' es segments[0]
 *   const context = getNavContext(activeTab);
 */
export function getNavContext(activeTab: string): NavContext {
  switch (activeTab) {
    case 'marketplace': return 'marketplace';
    case 'servicios':   return 'servicios';
    case 'social':      return 'social';
    case 'profile':     return 'profile';
    default:            return 'home';
  }
}
