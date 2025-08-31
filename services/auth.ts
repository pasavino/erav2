// /services/auth.ts
import { requestForm, type ApiResponse } from './http';

export type LoginExtra = { token: string; user?: { email: string } };

export const auth = {
  login: (email: string, password: string) =>
    requestForm<LoginExtra>('/ax_login.php', { email, password }),
};

// (Opcional) recover luego:
// export const recover = (email: string) => requestForm<{}>('/ax_recover.php', { email });