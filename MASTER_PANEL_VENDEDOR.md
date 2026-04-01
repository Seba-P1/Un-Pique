# MASTER — Panel de Vendedor · Un Pique
**Stack:** React Native + Expo SDK 54 · Expo Router v6 · NativeWind v4 · Zustand v5 · Supabase · #FF6B35

---

## ESTADO ACTUAL

| Sección | Estado | Problema |
|---|---|---|
| Dashboard | Mock | Datos hardcodeados, no conectado |
| Productos | Roto | Sin business_id, no guarda en Supabase |
| Pedidos | Mock | No trae datos reales, UI mal proporcionada |
| Configuración General | Parcial | Toggles mal coloreados, horario sin doble turno, UI antigua |
| Crear negocio | Faltante | No existe flow para crear el negocio inicial |

---

## ARQUITECTURA DE DATOS (Supabase)

### Tablas involucradas
- `users` → campo `roles: user_role[]` (el usuario debe tener `business_owner`)
- `businesses` → negocio vinculado al usuario via `owner_id`
- `products` → vinculados a `business_id`
- `orders` → pedidos con `business_id`

### Problema raíz actual
El usuario `dc2b22f5` tiene rol `business_owner` pero **no tiene un registro en `businesses`**.
Todo el panel depende de encontrar ese registro para funcionar.

---

## PLAN DE TRABAJO — PROMPTS ATÓMICOS

---

### P0 — Crear negocio inicial en Supabase (ACCIÓN MANUAL — no es código)

**Ejecutar en SQL Editor de Supabase:**

```sql
INSERT INTO businesses (
  owner_id,
  name,
  slug,
  description,
  category,
  is_active,
  created_at
) VALUES (
  'dc2b22f5-ff9e-4fee-b8f5-48de04a63d7a',
  'Mi Negocio',
  'mi-negocio',
  'Descripción de mi negocio',
  'food',
  true,
  now()
)
RETURNING id;
```

**Guardar el `id` retornado** — se necesita para los siguientes prompts.

> ⚠️ Si la tabla `businesses` tiene campos obligatorios adicionales (NOT NULL sin default),
> el INSERT fallará. En ese caso ejecutar primero:
> `SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'businesses' ORDER BY ordinal_position;`
> y ajustar el INSERT según los campos requeridos.

---

### P1 — Conectar businessStore al usuario autenticado

```
P1 - Conectar businessStore al usuario autenticado

Contexto: El panel de vendedor no funciona porque no encuentra
el negocio del usuario. El usuario tiene owner_id en la tabla
businesses de Supabase.

Archivo clave: stores/businessStore.ts (o similar)

Tareas:
1. Agregar acción fetchMyBusiness() que haga:
   SELECT * FROM businesses WHERE owner_id = auth.uid() LIMIT 1
2. Llamar fetchMyBusiness() al entrar al panel de vendedor
   (en el layout o _layout.tsx de /business/)
3. Si no encuentra negocio → mostrar pantalla "Crear tu negocio"
   (no romper con error genérico como ahora)
4. Exponer selectedBusiness y myBusinessId desde el store
   para que todas las sub-pantallas lo usen

No modificar lógica de auth. Solo businessStore y el layout.
```

---

### P2 — Fix toggles: reemplazar color verde por #FF6B35

```
P2 - Fix colores de Toggle en panel de vendedor

Los toggles (Switch) en Configuración General muestran verde
en estado activo. Deben usar el color primario de la app.

Color primario: #FF6B35

Buscar todos los componentes Switch/Toggle en:
- app/business/ (todas las sub-rutas)
- components/ (si hay un componente Toggle reutilizable)

Cambiar trackColor={{ true: '#FF6B35' }} y/o
thumbColor cuando corresponda.

No modificar lógica, solo color. Fix quirúrgico.
```

---

### P3 — Conectar sección Productos a Supabase

```
P3 - Conectar sección Productos del panel vendedor a Supabase

Contexto: Al intentar guardar un producto aparece
"No se encontró información del negocio". El store ya
debería tener myBusinessId después del P1.

Archivos: app/business/products/ y stores/productStore.ts

Tareas:
1. En la pantalla de crear/editar producto, obtener
   myBusinessId desde businessStore
2. Al guardar, hacer INSERT en tabla products con:
   - business_id: myBusinessId
   - name, description, price, stock del formulario
   - is_active: true por default
3. Después de guardar exitoso → navegar al listado
   de productos y refrescar la lista
4. Listar los productos reales del negocio
   (SELECT * FROM products WHERE business_id = myBusinessId)
5. Mostrar estado vacío si no hay productos aún

No implementar imagen por ahora (eso va en P6).
```

---

### P4 — Horario con doble turno por día

```
P4 - Fix horario de negocio: soporte doble turno por día

Contexto: En Configuración General → Horarios, cada día
solo permite un horario (ej: 09:00 a 20:00). Se necesita
soporte para dos turnos por día (ej: 08:00-12:00 y 18:00-23:00).

Estructura de datos objetivo por día:
{
  enabled: boolean,
  turno1: { open: string, close: string },
  turno2: { enabled: boolean, open: string, close: string }
}

Tareas:
1. Modificar el componente de fila de día para mostrar
   opción "+ Agregar turno" cuando el día está habilitado
2. Al activar turno 2, mostrar segunda fila de horarios
3. Actualizar la estructura de datos que se guarda en Supabase
   (campo schedule o similar en tabla businesses)
4. Mantener compatibilidad: si no tiene turno2, funciona igual

Respetar el diseño oscuro actual. Solo agregar la funcionalidad.
```

---

### P5 — Rediseño Configuración General

```
P5 - Rediseño UI Configuración General del panel vendedor

Contexto: La navegación actual (Perfil | Info | Horarios | Envíos)
se ve descentrada y antigua. Necesita ser más moderna y funcional.

Cambios de diseño:
1. Reemplazar tabs horizontales superiores por navegación
   lateral integrada al sidebar del panel (como secciones)
   O usar tabs con estilo pill/capsule centrado y con íconos
2. Cada sección debe tener header claro con título e ícono
3. Campos de texto con estilo consistente con el resto del panel
4. Botón "Guardar Cambios" sticky al bottom, siempre visible
5. Sección Perfil: agregar campo para banner del negocio
   además del logo (dos upload zones)

Mantener toda la funcionalidad actual. Solo rediseño visual.
No tocar lógica de guardado.
```

---

### P6 — Upload de imágenes en web (fix definitivo)

```
P6 - Fix upload de imágenes desde web (PC)

Problema: El file picker abre pero después de seleccionar
la imagen no pasa nada. Afecta logo, banner y productos.

Investigar y resolver:
1. Localizar el helper de upload (useImagePicker, imageUpload, o similar)
2. En web, expo-image-picker devuelve un URI tipo blob: o base64
   que NO se puede subir directamente a Supabase Storage
3. Fix: convertir el resultado a File/Blob antes de subir:
   fetch(uri) → blob() → new File([blob], filename)
4. Subir a Supabase Storage con supabase.storage
   .from('bucket-name').upload(path, file)
5. Verificar políticas RLS del bucket: debe permitir
   INSERT a usuarios autenticados
6. Probar en: logo del negocio, banner, imagen de producto

No cambiar el flow de nativo (iOS/Android), solo web.
```

---

### P7 — Dashboard con datos reales

```
P7 - Conectar Dashboard del panel vendedor a datos reales

Contexto: El dashboard muestra datos mock hardcodeados.
Reemplazar con queries reales a Supabase.

Métricas a implementar (queries reales):
1. Pedidos nuevos hoy:
   SELECT count(*) FROM orders
   WHERE business_id = myBusinessId
   AND created_at >= now()::date
   AND status = 'pending'

2. Ingresos de hoy:
   SELECT sum(total) FROM orders
   WHERE business_id = myBusinessId
   AND created_at >= now()::date
   AND status IN ('completed', 'accepted')

3. Items a preparar:
   SELECT count(*) FROM orders
   WHERE business_id = myBusinessId
   AND status = 'accepted'

4. Pedidos entrantes en tiempo real:
   Suscripción con supabase.channel() a INSERT en orders
   WHERE business_id = myBusinessId

5. Gráfico de rendimiento: agrupar pedidos por hora del día actual

Si alguna query falla por RLS, reportar cuál y qué política falta.
```

---

### P8 — Fix UI Pedidos (proporciones y estados vacíos)

```
P8 - Fix UI sección Pedidos del panel vendedor

Problemas visuales actuales:
1. Las columnas de estado (Todos/Pendientes/Preparando/Listos)
   se ven mal proporcionadas y con fondo blanco que rompe
   el tema oscuro
2. El estado vacío "No hay pedidos" se ve bien pero las
   columnas de arriba son muy grandes para estar vacías

Cambios:
1. Reemplazar el layout de columnas fijas por tabs estilo
   pill/capsule con contador badge (como en apps de delivery)
   Ejemplo: [Todos (0)] [Pendientes (0)] [Preparando (0)] [Listos (0)]
2. Una sola área de contenido que cambia según el tab activo
3. Cada pedido en una card compacta con:
   - Número de pedido y cliente
   - Items resumidos
   - Tiempo transcurrido
   - Botones Aceptar/Rechazar (solo en Pendientes)
4. Estado vacío con ícono y texto centrado, sin columnas

Mantener la lógica de filtrado. Solo rediseño del layout.
```

---

## ORDEN DE EJECUCIÓN RECOMENDADO

```
P0 (manual SQL) → P1 → P2 → P3 → P6 → P4 → P5 → P7 → P8
```

**Razonamiento:**
- P0+P1 desbloquean todo lo demás (sin negocio nada funciona)
- P2 es un fix de 5 minutos, hacerlo temprano
- P3 permite empezar a cargar productos reales
- P6 desbloquea las imágenes (necesario para P3 completo)
- P4+P5 son mejoras de UX que no bloquean funcionalidad
- P7+P8 son polish final

---

## VERIFICACIÓN FINAL

Después de completar todos los prompts, ejecutar:

```bash
npx tsc --noEmit
```

Y probar manualmente:
- [ ] Crear producto con imagen desde PC
- [ ] Ver el producto en el marketplace como cliente
- [ ] Configurar horario con doble turno
- [ ] Ver dashboard con datos reales (al menos 0s reales, no mocks)

