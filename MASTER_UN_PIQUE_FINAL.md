# MASTER FINAL — Un Pique · Plan Completo
**Fecha:** 30 Abril 2026  
**Stack:** React Native + Expo SDK 54 · Expo Router v6 · NativeWind v4 · Zustand v5 · Supabase · #FF6B35

---

## 1. Visión y Modelo de Negocio
Un Pique es un marketplace hyperlocal diseñado para ciudades de menos de 35.000 habitantes (Río Colorado y La Adela).
*   **Modelo de Negocio:** Suscripción mensual (Base $28 / Premium $45) + 0% de comisión por venta (excepto en Trial que es 9%).
*   **Pilares:** Marketplace Local, Comunidad Social interactiva y Club Un Pique (Loyalty & Gamification).
*   **Target:** Unificación total (el "efecto hub") evitando que el usuario descargue múltiples apps de locales individuales.

---

## 2. DATOS REALES EN SUPABASE (NO MODIFICAR)

| Dato | Valor |
| :--- | :--- |
| **User ID** | `dc2b22f5-ff9e-4fee-b8f5-48de04a63d7a` |
| **Business ID** | `d19a8bf2-dc68-4788-a5df-d3eb28b5151a` |
| **Business name** | Sanguchito Tito |
| **Business slug** | `sanguchito-tito` |
| **Locality Río Colorado** | `f8b76cc2-4df3-4b9f-846f-08586b1ee3c3` |
| **Locality La Adela** | `ec5b7925-3e96-4910-bb16-1632cffb9143` |
| **Region Comarca del Colorado** | `502d0fd3-68d2-4ad9-89d9-36b4411930d6` |

---

## 3. ARQUITECTURA DEL LAYOUT Y REGLAS (CRÍTICO)

1. **Menú Lateral:** **NO usa Drawer nativo** de Expo Router. Usa `<DesktopSidebar />` en PC y `<MobileDrawer />` en mobile. (Para abrir drawer en cualquier pantalla: `import { openMobileDrawer } from '../../_layout'`).
2. **Panel Vendedor:** Tiene su propio layout en `app/business/_layout.tsx` con su propio sidebar, tab bar y header. **NO unificar** con AppHeader principal.
3. **AppHeader Universal:** Componente en `components/ui/AppHeader.tsx`.
4. **Bundle ID:** `com.unpique.app`
5. **Color Primario:** `#FF6B35`.
6. **Corazón de favoritos:** `#ef4444` (rojo) en toda la app.
7. **Safe Area:** Siempre usar `useSafeAreaInsets()` para padding bottom en mobile.
8. **Web Inputs:** En web, los `TextInput` necesitan el fix de `{ outline: 'none', outlineWidth: 0 } as any`.
9. **Upload web:** Convertir URI a blob → File antes de subir a Supabase.
10. **Scripts:** NUNCA crear scripts externos (`replace.js` o similares), editar los archivos directamente.

---

## 4. LO QUE YA FUNCIONA AL 100% ✅

| Área | Feature Implementada |
| :--- | :--- |
| **Core UI** | Tab bar responsive PedidosYa Style, Header universal, Drawer unificado, Desktop layout 2 columnas. |
| **Vendedor** | Panel Vendedor Mobile (hamburguesa, ajustes), Productos (crear/editar/borrar), Horario doble turno. |
| **Gestión DB** | Conexión a Supabase, Guardar Configuración, Dashboard Estadísticas reales. |
| **Checkout** | Métodos de Pago (Efectivo y MercadoPago UI), Carrito con `delivery_fee` real, UI Pedidos Pill. |
| **Tiendas** | `/shop/[slug]` unificado (sin colisiones con `/product/`), Sabor Local con 6 secciones, Búsqueda inline. |
| **Social Feed** | Parser dual UI (`[service:id]` y `[business:id]`), Avatar fallback en posts, Historias activas, Integración de Misiones en Muro. |
| **UX & Cards** | `BusinessCardWide` / `Compact` (estilo PedidosYa), ProductCards con glassmorphism, Banner Parallax. |
| **Perfiles** | Banner de Mi Perfil editable (image picker + upload a `avatars/covers`), Sistema de Favoritos completo (Pantalla `/favorites` unificada), Compartir negocios a muro interno. |
| **Loyalty Club** | UI Completa del Club Un Pique, Canje de puntos con QR, Misiones de Usuario y Panel de Vendedor para gestión de misiones/claims. |
| **Loyalty DB** | Todos los 14 Scripts de Supabase de Loyalty implementados (Tiers, Missions, Claims, Triggers, etc.). |

---

## 5. FEATURES PENDIENTES & BUGS ⏳

### FASE 3: PULIDO Y LANZAMIENTO
*   **BUG:** Revisar navegación en Web para evitar que el `Drawer` intente abrirse como componente nativo (usar el DesktopSidebar).
*   **FEATURE:** Sistema de notificaciones Push para avisar al usuario cuando su misión fue aprobada.
*   **UX:** Implementar Skeleton Loaders en la pantalla de Social para mejorar la percepción de carga.

### DECISIONES PENDIENTES
*   Clearing de puntos inter-local (Cómo Un Pique balancea los puntos canjeados cruzados) → **Post V1**.
*   Suscripciones base/premium para *Servicios* y *Alojamientos* → **Bloqueante para cobrarles**.
*   Aprobación MercadoPago Marketplace Api → **Bloqueante para el Go-Live de pagos split**.
