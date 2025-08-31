// /services/rides.ts
import { requestForm } from './http';

export type Ride = { id: string; from: string; to: string; date: string; price: number };
export type SearchRidesExtra = { lista: Ride[] };

export const rides = {
  // Backend: {error,msg,lista:[Ride]}
  search: (q:{ from:string; to:string; date?:string }) =>
    requestForm<SearchRidesExtra>('/ax_search_rides.php', {
      from: q.from, to: q.to, date: q.date || ''
    }),
};