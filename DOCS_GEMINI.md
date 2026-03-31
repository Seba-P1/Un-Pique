# Documentación Un Pique - Estado del Proyecto (Fase 6)

Acá tenés el estado actualizado, planificado y detallado de todo lo que se hizo, modificó y lo que queda por hacer en el proyecto para que puedas retomarlo posteriormente sin perder contexto.

## 1. Lo que ya está completado (Base de Datos e Infraestructura)
- Todo el esquema SQL de `businesses`, `products`, `orders` ha sido implementado exitosamente en el servidor de Supabase.
- Configuración en la app Expo del `eas.json` y `app.json`.
- Implementación de stores principales usando Zustand (`authStore`, `businessStore`, `productStore`, `listingStore`).

## 2. Novedad: Plataforma "Sabor Local" (Refactorizada con Supabase)
Terminamos de migrar todo el sistema de "Sabor Local" para que deje de estar hardcodeado con datos mock y funciones con la base de datos real.

**Archivos Modificados / Creados:**
1. `stores/businessStore.ts`:
   - Se añadió `fetchBusinessByOwner()` para cargar el negocio según el usuario autenticado (con `owner_id`).
   - El tipo `Business` fue adaptado.
2. `stores/productStore.ts`:
   - El modelo `Product` ahora mapea `category_id` y `stock`.
3. `app/business/_layout.tsx`:
   - Se agregó un `useEffect` que carga el negocio del vendedor.
4. `app/business/products.tsx`:
   - Refactor absoluto: Se eliminó `MOCK_PRODUCTS`.
   - Ahora consume `products` array desde `productStore`.
5. `app/(tabs)/marketplace/restaurant/[id].tsx`:
   - Integrado Supabase. Este componente ahora consume el store para obtener los `products` de un `owner`.
   - El header, precios, e imágenes consumen el estado `selectedBusiness`.
   - Ahora mapea el `category_id` adecuadamente desde la base en lugar de categorías *mock*. 

## 3. Sistema de Publicación de Servicios / Alojamiento (Fase 4 - Terminada)
Todo el sistema unificado de publicacion bajo la tabla `listings` permite a los usuarios publicar tanto servicios como alojamientos sin depender de datos falsos.

## 4. Próximos Pasos Plasmados (Por Hacer - Fase 6)
Para asegurar que todo esté perfecto y continúes avanzando, tenés la siguiente checklist:

### A. Mi Perfil ✅ (Completado)
- Se ocultaron "Dashboard Vendedor"/"Dashboard Repartidor" en perfil y drawer si el usuario no tiene roles correspondientes.
- "Mis Publicaciones" solo aparece si el usuario tiene al menos un listing creado.
- Se eliminó el botón DEV de sembrado de datos.

### B. Social ✅ (Completado - Auditoría Exhaustiva)
- Se eliminaron 4 bloques de datos MOCK (stories, trending, suggestions, events).
- **Share nativo**: El botón "Compartir" ahora usa `Share` de React Native en mobile y `navigator.share/clipboard` en web.
- **Menú contextual**: El botón "⋮" ahora abre opciones (Reportar / Copiar contenido).
- **Guardar**: Muestra alert "Próximamente".
- Se removió el badge de verificación ✓ que aparecía falsamente en todos los posts.
- `SocialPreview.tsx` (Home) ahora muestra el último post real de la comunidad en vez de un post inventado.
- El panel de Comunidad (desktop) muestra placeholders honestos.

**Mejoras futuras para potenciar la sección Social (visión Facebook + X + Instagram):**
1. **Historias reales** — Tabla `stories` con imágenes/videos que expiren a las 24h.
2. **Sistema de seguimiento (Follow)** — Tabla `follows` para personalizar el feed.
3. **Tendencias reales** — Extraer hashtags de los posts y rankear por frecuencia.
4. **Eventos integrados** — Tabla `events` con RSVP y calendario.
5. **Guardados** — Tabla `saved_posts` para bookmark funcional.
6. **Perfiles públicos** — Vista de perfil de otros usuarios con sus posts.
7. **Reacciones múltiples** — Más allá del "Me gusta" (like, love, 🔥, etc).
8. **Notificaciones en tiempo real** — Push cuando alguien comenta, da like o te sigue.

### C. Login con Google
- **Objetivo**: Agregar funcionalidad OAuth 2.0 (Google Login).
- **Plan**: Configurar `expo-auth-session/providers/google`. Instalar el provider para web/Android y conectarlo con la autenticación de Supabase existente. Requerirá IDs de Google Cloud Console.

### D. Notificaciones Push (Fase 3)
- **Objetivo**: Terminar implementaciones de notificaciones.
- **Plan**: Configurar el archivo de notificaciones (expo-device & expo-notifications) en el login o app root del usuario para registrar `push_tokens` dentro de una tabla nueva en Supabase (`users.push_token` o tabla extendida) para luego mandar novedades desde funciones edge de Supabase o backend.

---
> 💡 *Nota para siguientes iteraciones*: La base asíncrona de la compra y del carrito no ha sido enchufada con MercadoPago aún. Esperar a los tests en Vercel/Expo Web y proceder cuando el Login y Social estén resueltos.
