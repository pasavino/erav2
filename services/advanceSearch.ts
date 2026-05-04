// services/advanceSearch.ts
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

export type SearchParams = {
  from: string;
  to: string;
  dateFrom: string;
  dateTo: string;
  priceFrom: string;
  priceTo: string;
  page?: number;
};

export type SearchResult = {
  lista: Trip[];
  error: number;
  msg: string;
  hasMore?: boolean;
};

export const advanceSearchService = {
  search: (params: SearchParams) => {
    const page = params.page || 1;
    const searchParams = { ...params, page: String(page) };
    return requestForm<SearchResult>('/ax_advsearch.php', searchParams);
  },
};
