---
name: persistent-context
description: Maintain a persistent context file (contexto_antigravity.md) that tracks ALL work done across sessions. Ensures continuity and prevents information loss.
---

# Persistent Context Skill

## Purpose
Maintain a `contexto_antigravity.md` file in the project root that documents **everything** done across sessions. This is the single source of truth for project history.

## Rules

### 1. When to Update
- **After completing a batch of tasks** (NOT during — wait until done)
- **Before notifying the user** that work is complete
- **Always ask the user first** before writing to this file (they may want to switch to a cheaper model for this task)

### 2. File Structure
```markdown
# Contexto Antigravity — [Project Name]
> Última actualización: [fecha]

## Estado Actual
[Resumen breve del estado del proyecto]

## Historial de Cambios

### [Fecha] — [Título del batch]
- **Archivos modificados:** lista
- **Qué se hizo:** resumen
- **Bugs fijados:** lista
- **Pendientes:** lista

### [Fecha anterior] — [Título]
...

## Arquitectura y Decisiones
[Decisiones técnicas importantes]

## Bugs Conocidos y Pendientes
[Lista actualizada]
```

### 3. Token Efficiency Protocol
> 🔴 **MANDATORY:** Before writing to `contexto_antigravity.md`:
> 1. **STOP** and ask the user: "¿Quieres que cargue el contexto ahora o cambias a Flash?"
> 2. **Wait** for user confirmation
> 3. Only then write the file

### 4. What to Track
- Every file modified and why
- Every bug fixed
- Design decisions made
- Dark mode status per screen
- Pending items
- User preferences and requirements

### 5. What NOT to Track
- Internal planning steps
- Failed attempts (unless they reveal important info)
- Redundant information already in code comments
