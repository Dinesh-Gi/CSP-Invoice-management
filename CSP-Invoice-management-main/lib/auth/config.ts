export const AUTH_COOKIE_NAME = "zeit_csp_session";

export const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
  throw new Error("AUTH_SECRET is not defined");
}