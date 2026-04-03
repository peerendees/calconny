// CalConny V2: Supabase Auth Middleware
// In V2 wird hier die Session-Prüfung implementiert.
// Geschützte Routen: /app/*, /api/calendar/book
// Öffentliche Routen: /, /login, /api/calendar (lesend)

export function middleware() {
  // V1: kein Auth, alles durchlassen
}

export const config = {
  matcher: [],
};
