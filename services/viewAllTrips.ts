// /services/viewAllTrips.ts
import { requestForm } from './http';

export type Trip = {
  id: string | number;
  from: string;
  to: string;
  date: string;
  time?: string;
  price?: number;
  driver_avatar?: string;
  icono?: string;
  libres?: number;
};

export type ViewAllTripsExtra = {
  data: Trip[];
  hasMore: boolean;
};

export const viewAllTripsService = {
  list: (page: number, pageSize: number) =>
    requestForm<ViewAllTripsExtra>('/ax_viewalltrip.php', {
      page: String(page),
      pageSize: String(pageSize),
    }),
};
