// CalConny V2: Supabase Auth Proxy (früher „Middleware“, in Next.js 16 umbenannt)
// In V2 wird hier die Session-Prüfung implementiert.
// Geschützte Routen: /app/*, /api/calendar/book
// Öffentliche Routen: /, /login, /api/calendar (lesend)

export function proxy() {
  // V1: kein Auth, alles durchlassen
}

export const config = {
  matcher: [],
};
