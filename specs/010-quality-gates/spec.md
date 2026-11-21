: Typecheck y lint como gate

**Feature Branch**: `010-quality-gates`

**Created**: 2026-11-21

**Status**: Done

**Input**: Backlog BL-010: asegurar que `tsc --noEmit` y `expo lint` sean gates de calidad estático antes de mergear.

## User Scenarios & Testing

### User Story 1 - Gate de calidad estático (Priority: P1)

Todo cambio en el frontend debe pasar `npm run typecheck` y `npm run lint` sin errores antes de integrarse a `develop`.

**Acceptance Scenarios**:

1. **Given** un cambio en el frontend, **When** se corre `npm run typecheck`, **Then** no hay errores.
2. **Given** un cambio en el frontend, **When** se corre `npm run lint`, **Then** no hay errores.
3. **Given** el proceso de merge, **When** se revisa `AGENTS.md`, **Then** los gates están documentados.

## Requirements

### Functional Requirements

- **FR-001**: `npm run typecheck` (equivalente a `tsc --noEmit`) DEBE pasar sin errores.
- **FR-002**: `npm run lint` (equivalente a `expo lint`) DEBE pasar sin errores.
- **FR-003**: Los gates DEBEN estar documentados en `AGENTS.md` como requisito previo al merge.

## Success Criteria

- **SC-001**: `npm run typecheck` y `npm run lint` pasan limpios en `develop`.
- **SC-002**: `AGENTS.md` documenta los gates.

## Assumptions

- Los tests del backend y frontend se agregarán en BL-011 y BL-012; este ítem se enfoca solo en typecheck y lint.
