/**
 * Canonical process codes supported by the domain layer today.
 *
 * Adding a future process (LASER_CUTTING, BENDING, WELDING, ...) means:
 *   1. seed a new ManufacturingProcess row with that code
 *   2. add a schema module under src/domain/processes and register it
 *      in registry.ts
 * No other part of the system (Prisma schema, matching engine wiring,
 * API routes) needs to change.
 */
export const CNC_MILLING = "CNC_MILLING" as const;
export const CNC_TURNING = "CNC_TURNING" as const;

export type KnownProcessCode = typeof CNC_MILLING | typeof CNC_TURNING;
