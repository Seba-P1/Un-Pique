# Contexto Antigravity — Un Pique (Sabor Local)
> Última actualización: 2026-02-26

## Estado Actual
El proyecto se encuentra en una fase avanzada de rediseño premium. Se ha completado la transición global a **Dark Mode** (vía `useThemeColors`) y se han implementado micro-interacciones de alta fidelidad para mejorar la percepción de "app nativa premium". La estructura de navegación se ha optimizado y se han integrado herramientas de IA (NotebookLM) para la gestión del conocimiento.

## Historial de Cambios

### 2026-02-26 — Premium Overhaul: Fases 7, 8 y 9
- **Archivos modificados:**
    - `components/services/ProfessionalCard.tsx`, `app/directory/[id].tsx`, `app/profile/edit.tsx`, `app/orders/history.tsx`, `app/chat/[id].tsx`, `app/onboarding/location.tsx`, `app/onboarding/features.tsx`, `app/directory/index.tsx`, `app/admin/dashboard.tsx` (Refactorización completa a Dark Mode).
    - `app/(tabs)/_layout.tsx` (Limpieza de duplicados en MobileDrawer).
    - `app/index.tsx`, `components/ui/SplashScreen.tsx` (Rediseño de Splash Screen con organic radial glow).
    - `components/ui/Header.tsx` (Animación de búsqueda expandida y lógica responsive de ubicación).
    - `components/delivery/BusinessCard.tsx` (Animaciones Scale/Hover premium).
- **Qué se hizo:**
    - Auditoría y corrección de colores hardcodeados en 10+ pantallas restantes.
    - Implementación de `LayoutAnimation` en el header para transiciones fluidas.
    - Sustitución de gradientes lineales por orbes desenfocados (blur/shadows) para un efecto visual Apple-like en el splash.
    - Optimización del Drawer para evitar redundancia con el bottom tab bar.
- **Pendientes:**
    - Verificar persistencia de estados tras el rediseño.
    - Revisar performance de animaciones en dispositivos Android de gama baja.

### 2026-02-25 — Integración NotebookLM
- **Qué se hizo:**
    - Conexión exitosa de NotebookLM vía MCP.
    - Sincronización de tokens de sesión para acceso a notebooks del proyecto.

## Arquitectura y Decisiones
- **Tema Dinámico:** Se utiliza estrictamente el hook `useThemeColors()` para que todos los componentes reaccionen al modo claro/oscuro de forma centralizada.
- **Sombras/Blur:** Para mantener un look premium en web y nativo, se prefiere el uso de `shadows` con alta dispersión en lugar de bordes marcados.
- **Navegación:** `expo-router` es el estándar. Se evitan duplicidades entre el Drawer y el TabBar para no confundir al usuario.

## Bugs Conocidos y Pendientes
- [ ] Posible delay en la actualización del Splash Screen en algunos dispositivos (caching de Expo).
- [ ] Ajustar el "Quick Access Menu" del Header para que no tape elementos críticos en navegadores desktop muy estrechos.
