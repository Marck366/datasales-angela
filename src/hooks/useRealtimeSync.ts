/**
 * No-op tras la migración a FastAPI + MySQL (sin WebSockets).
 * React Query invalida caches en cada mutación (`onSuccess`) y refetcha
 * en window-focus, que es suficiente para mantener los datos frescos.
 */
export const useRealtimeSync = () => {};
