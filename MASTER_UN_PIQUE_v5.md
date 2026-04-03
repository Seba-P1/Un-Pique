# MASTER v5 — Un Pique · Plan Completo
**Fecha:** 02 Abril 2026
**Stack:** React Native + Expo SDK 54 · Expo Router v6 · NativeWind v4 · Zustand v5 · Supabase · #FF6B35

---

## DATOS REALES EN SUPABASE

| Dato | Valor |
|---|---|
| User ID | dc2b22f5-ff9e-4fee-b8f5-48de04a63d7a |
| Business ID | d19a8bf2-dc68-4788-a5df-d3eb28b5151a |
| Business name | Sanguchito Tito |
| Business slug | sanguchito-tito |
| Locality Río Colorado | f8b76cc2-4df3-4b9f-846f-08586b1ee3c3 |
| Locality La Adela | ec5b7925-3e96-4910-bb16-1632cffb9143 |
| Region Comarca del Colorado | 502d0fd3-68d2-4ad9-89d9-36b4411930d6 |

---

## LO QUE FUNCIONA ✅

| Feature | Estado |
|---|---|
| Panel vendedor conectado a Supabase | ✅ |
| Crear/listar productos reales | ✅ |
| Upload imágenes web (logo, banner, producto) | ✅ |
| Horario doble turno por día | ✅ |
| Guardar config general | ✅ |
| Métodos de pago: efectivo y MercadoPago | ✅ |
| MercadoPago UI (botón conectar) | ✅ |
| Carrito sin mock data, delivery_fee real | ✅ |
| Aclaraciones funcionales en modal producto | ✅ |
| Dashboard con datos reales | ✅ |
| Pedidos UI con tabs pill | ✅ |
| Tarjetas de negocios con logo y badge abierto/cerrado | ✅ |
| AppToggle naranja en web | ✅ |
| Slug estático | ✅ |
| AppHeader universal creado | ✅ |
| MobileDrawer con todas las secciones | ✅ |
| Tab bar safe area | ✅ |
| Routing shop/[slug] unificado | ✅ |
| /shop/[slug] con datos reales | ✅ |
| Búsqueda inline en Sabor Local | ✅ |
| Componentes StoryViewer y CreateStoryModal creados | ✅ |

---

## ARQUITECTURA DEL LAYOUT (CRÍTICO)

- El menú lateral NO usa Drawer nativo de Expo Router
- Usa `<DesktopSidebar />` en PC y `<MobileDrawer />` en mobile
- Para abrir el drawer desde cualquier pantalla: `import { openMobileDrawer } from '../../_layout'`
- El `<MobileDrawer />` está en `app/(tabs)/_layout.tsx`
- El Panel Vendedor tiene su propio layout en `app/business/_layout.tsx` con su propio sidebar y tab bar
- AppHeader universal: `components/ui/AppHeader.tsx`

---

## DECISIONES TOMADAS

- **Sección Comunidad (Social):** Reemplazar datos hardcodeados por placeholders vacíos y limpios. No desarrollar funcionalidad ahora — se implementará cuando haya usuarios y contenido real.
- **Historias Locales:** Los componentes StoryViewer y CreateStoryModal ya existen. Solo falta conectar el botón "Tu historia" al modal.
- **Navegación inferior Panel Vendedor:** El botón "Perfil" debe llevar a `/business/settings` (Configuración General) con ícono de configuración.
- **Métodos de pago:** Solo efectivo y MercadoPago. Sin transferencia ni tarjetas separadas.

---

## BUGS ACTIVOS 🐛

### ~BUG-VENDOR-1 — Header del panel vendedor diferente al resto~ ✅
**Problema:** El header en `app/business/` tiene un estilo distinto al AppHeader universal. Muestra "Sebastian Peña / Panel Vendedor" de forma diferente.
**Fix:** El panel vendedor tiene su propio header por diseño (es una sección separada), pero debe estar correctamente estilizado y consistente internamente. El botón hamburguesa debe abrir el drawer del panel vendedor (no el drawer principal de la app).

### ~BUG-VENDOR-2 — Botón hamburguesa no funciona en mobile en el panel vendedor~ ✅
**Problema:** Al tocar el ícono de menú en el header del panel vendedor en mobile, no pasa nada.
**Causa probable:** El panel vendedor tiene su propio `openDrawer` function que no está conectada al botón del header.
**Fix:** Conectar el botón hamburguesa del header del panel al drawer del panel vendedor.

### ~BUG-VENDOR-3 — Navegación inferior del panel vendedor: "Perfil" lleva al perfil de usuario~ ✅
**Problema:** El tab "Perfil" en la tab bar inferior del panel vendedor navega al perfil de usuario general en vez de a la Configuración General del negocio.
**Fix:** Cambiar la ruta del tab "Perfil" a `/business/settings` y cambiar el ícono a Settings (engranaje).

### ~BUG-PROFILE-1 — No se puede editar el banner en Mi Perfil~ ✅
**Problema:** El botón "Editar portada" en `app/(tabs)/profile/index.tsx` no hace nada al presionarlo.
**Fix:** Conectar el botón al ImagePicker (igual que en el upload de banner del panel vendedor) y subir a Supabase Storage bucket `avatars` con path `covers/[userId]/banner.jpg`. Actualizar el campo `cover_url` o `banner_url` en la tabla `profiles`.

### ~BUG-PROFILE-2 — Franja visible debajo del header en Mi Perfil~ ✅
**Problema:** En mobile, debajo del header redondeado se ve una franja oscura/marrón que delata el contenedor padre.
**Fix:** En `app/(tabs)/profile/index.tsx`, el contenedor padre del AppHeader debe tener `backgroundColor: 'transparent'`. El AppHeader necesita recibir `bgColor` que coincida con el fondo de la pantalla o `'transparent'`.

### BUG-SOCIAL-1 — Avatar no aparece en publicaciones propias
**Problema:** En el feed de Social, las publicaciones del usuario logueado no muestran su avatar al lado del nombre.
**Fix:** En el componente de post/publicación, asegurarse de que usa `profile.avatar_url` del usuario autenticado para mostrar el avatar. Si `avatar_url` es null, mostrar inicial del nombre sobre fondo #FF6B35.

### BUG-SOCIAL-2 — Historias: botón "Tu historia" no abre el modal
**Problema:** Los componentes `CreateStoryModal` y `StoryViewer` existen pero el botón "Tu historia" en la pantalla Social no los activa.
**Fix:** En `app/(tabs)/social/index.tsx`:
1. Importar `CreateStoryModal` y `StoryViewer`
2. Agregar estado: `const [showCreateStory, setShowCreateStory] = useState(false)`
3. Conectar el botón "Tu historia" al modal: `onPress={() => setShowCreateStory(true)}`
4. Renderizar `<CreateStoryModal visible={showCreateStory} onClose={() => setShowCreateStory(false)} />`
5. Verificar que `storiesStore.createStory()` llama correctamente a Supabase Storage

### BUG-SOCIAL-3 — Sección Comunidad con datos hardcodeados
**Problema:** Las subsecciones "Tendencias en Río Colorado", "Sugerencias para vos" y "Próximos Eventos" muestran texto de placeholder como datos reales.
**Fix:** Reemplazar el contenido por un estado vacío limpio por sección:
- Sin texto descriptivo falso
- Solo ícono + "Próximamente" o directamente no renderizar la sección
- NO eliminar la estructura del componente Comunidad (se usará a futuro)

---

## PLAN COMPLETO — PROMPTS EN ORDEN

### FASE 3 — Fixes mobile y Social

---

### FIX-VENDOR-MOBILE — Panel vendedor: header, hamburguesa y tab bar

```
FIX-VENDOR-MOBILE - Fix panel vendedor en mobile: 3 bugs juntos

Los 3 bugs están en app/business/_layout.tsx y su header.

BUG 1 — Botón hamburguesa no funciona:
En app/business/_layout.tsx, el header del panel vendedor
tiene un botón hamburguesa (ícono de menú). En mobile,
al presionarlo no pasa nada.
Buscar la función que abre el drawer del panel vendedor
y conectarla al onPress del botón hamburguesa.
Si usa un estado local `drawerVisible`, verificar que
el botón llama `setDrawerVisible(true)` o similar.

BUG 2 — Tab bar inferior: "Perfil" debe ir a Configuración General:
En la tab bar inferior del panel vendedor, el tab que
dice "Perfil" (o similar) debe:
- Navegar a /business/settings (Configuración General)
- Usar ícono Settings de lucide-react-native
- Label: "Ajustes" o "Config"

BUG 3 — Header estilizado:
El header del panel vendedor debe verse consistente.
Altura: 52px. Fondo oscuro semitransparente.
El nombre del usuario y "Panel Vendedor" deben verse
limpios, con el nombre en bold y el subtítulo muted.
Bordes inferiores redondeados: borderBottomLeftRadius: 20,
borderBottomRightRadius: 20.

No modificar la lógica de navegación de rutas.
No tocar el AppHeader de la app principal.
Verificar con npx tsc --noEmit al terminar.
```
**Modelo recomendado: Pro (Low)**

---

### FIX-PROFILE-BANNER — Fix banner editable en Mi Perfil

```
FIX-PROFILE-BANNER - Fix botón "Editar portada" en Mi Perfil

En app/(tabs)/profile/index.tsx, el botón "Editar portada"
no hace nada al presionarlo.

Verificar primero la estructura de la tabla profiles:
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

Tareas:
1. Conectar el botón "Editar portada" al ImagePicker:
   - Usar expo-image-picker (ya está instalado)
   - aspect: [16, 9] (banner horizontal)
   - quality: 0.8
   
2. Al seleccionar imagen:
   - Subir a Supabase Storage bucket 'avatars'
   - Path: covers/[userId]/banner.jpg
   - En web: usar el fix de blob → File (igual que en businessStore)
   
3. Guardar la URL en la tabla profiles:
   - Campo a actualizar: verificar si es cover_url, banner_url
     o similar según el resultado del SELECT de arriba
   - Si no existe el campo → usar cover_url como nombre
   
4. Mostrar la imagen actualizada inmediatamente (optimistic update)

5. Fix franja visible debajo del header:
   En el mismo archivo, el contenedor padre del AppHeader
   debe tener backgroundColor: 'transparent'.
   El AppHeader de esta pantalla debe recibir la prop
   bgColor con el color de fondo de la pantalla o 'transparent'.

No modificar lógica de auth ni otros campos del perfil.
Verificar con npx tsc --noEmit al terminar.
```
**Modelo recomendado: Pro (Low)**

---

### FIX-SOCIAL - Fix Social: avatar en posts, historias y comunidad limpia

```
FIX-SOCIAL - Fix 3 bugs en pantalla Social

BUG 1 — Avatar no aparece en publicaciones propias:
En el componente que renderiza cada post/publicación
en app/(tabs)/social/index.tsx o en components/social/,
buscar dónde se muestra el avatar del autor del post.
Si avatar_url is null or undefined, mostrar un View
circular con la inicial del nombre sobre fondo #FF6B35.
El avatar debe aparecer siempre, no solo cuando hay URL.

BUG 2 — Botón "Tu historia" no abre el modal:
En app/(tabs)/social/index.tsx:
1. Importar CreateStoryModal desde components/social/
2. Agregar estado: const [showCreateStory, setShowCreateStory] = useState(false)
3. El botón "Tu historia" (el círculo con +) debe llamar:
   onPress={() => setShowCreateStory(true)}
4. Renderizar al final del componente:
   <CreateStoryModal
     visible={showCreateStory}
     onClose={() => setShowCreateStory(false)}
   />
5. Verificar que storiesStore tiene createStory() implementado
   con upload a Supabase Storage. Si no existe el store,
   crear stores/storiesStore.ts with:
   - createStory(uri, type, localityId) → upload + INSERT
   - fetchStories(localityId) → SELECT stories con join profiles

BUG 3 — Sección Comunidad con datos falsos:
En la sección "Comunidad" (panel derecho en desktop /
sección inferior en mobile), reemplazar el contenido
actual de cada subsección por un placeholder limpio:

Cada subsección (Tendencias, Sugerencias, Próximos Eventos)
debe mostrar SOLO:
- El ícono ya existente
- El título ya existente  
- UN texto: "Disponible próximamente"
- SIN el texto descriptivo actual que parece contenido real

NO eliminar la estructura ni los componentes.
NO agregar funcionalidad nueva.
Solo limpiar el texto falso.

Verificar con npx tsc --noEmit al terminar.
```
**Modelo recomendado: Pro (Low)**

---

### FASE 2 — Features pendientes del MASTER v4 (orden sin cambios)

---

### P12-B — Rediseño Sabor Local con múltiples secciones
**Modelo recomendado: Pro (High)** — esperar créditos disponibles

```
[Ver prompt completo en MASTER v4 — P12-B]
PREREQUISITO: P12-A completado y aprobado visualmente.
```

### P12-C — Cards de productos estilo PedidosYa
**Modelo recomendado: Pro (Low)**
```
[Ver prompt completo en MASTER v4 — P12-C]
PREREQUISITO: P12-B completado.
```

### P12-D — Banner premium con parallax en tienda
**Modelo recomendado: Pro (Low)**
```
[Ver prompt completo en MASTER v4 — P12-D]
```

### P12-E — Comarca del Colorado en el marketplace
**Modelo recomendado: Pro (Low)**
```
[Ver prompt completo en MASTER v4 — P12-E]
```

### P13 — Sistema de Favoritos
**Modelo recomendado: Pro (High)** — esperar créditos disponibles
```
[Ver prompt completo en MASTER v4 — P13]
```

---

## ORDEN DE EJECUCIÓN

```
FASE 3 (fixes mobile y Social — ejecutar ahora):
FIX-VENDOR-MOBILE → FIX-PROFILE-BANNER → FIX-SOCIAL

FASE 2 (features — requieren Pro High o Pro Low):
P12-B → P12-C → P12-D → P12-E → P13
```

---

## NOTAS PARA ANTIGRAVITY

- Siempre verificar con npx tsc --noEmit al terminar cada prompt
- No tocar archivos no mencionados en el prompt
- Si un componente ya tiene el estilo correcto, no modificarlo
- El Panel Vendedor tiene su propio sistema de header y drawer — separado del AppHeader universal de la app principal
- safe area: siempre usar useSafeAreaInsets() para padding bottom en mobile
- Color primario: #FF6B35
- Bundle ID: com.unpique.app
- Responder siempre en español
