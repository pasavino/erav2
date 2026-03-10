// /services/rides.ts
import { requestForm } from './http';

export type Ride = {
  IdViaje: number | string;
  IdUsuarioDriver?: number | string;
  CityFrom: string;
  CityTo: string;
  FechaHora: string;
  Estado: number;
  Pax?: number;
  EstadoNombre?: string;
  Icono?: string;
};
export type SearchRidesExtra = { lista: Ride[] };

export const rides = {
  // Backend: {error,msg,lista:[Ride]}
  search: (q:{ from:string; to:string; date?:string }) =>
    requestForm<SearchRidesExtra>('/ax_search_rides.php', {
      from: q.from, to: q.to, date: q.date || ''
    }),

  // === Driver side helpers (nuevo) ===
  // lista los viajes disponibles para iniciar o gestionar.
  // { lista:[Ride] }
  list: () => requestForm<SearchRidesExtra>('/ax_list_rides.php', {}),

  // iniciar un viaje dado su id (devuelve error 0 si OK)
  // Se puede enviar la ubicación actual para validar que el conductor inició en el origen
  start: (rideId: string, coords?: { lat: number; lng: number }) =>
    requestForm('/ax_start_ride.php', {
      idviaje: rideId,
      ...(coords ? { lat: String(coords.lat), lng: String(coords.lng) } : {}),
    }),

  // finalizar un viaje activo
  finish: (rideId: string) => requestForm('/ax_finish_ride.php', { idviaje: rideId }),

  // Obtener lista de pasajeros para un viaje
  passengers: (rideId: string) => requestForm<{ lista: { NombrePax: string; Telefono: string; Seat?: number; Bags?: number }[] }>('/ax_list_passengers.php', { idviaje: rideId }),
};