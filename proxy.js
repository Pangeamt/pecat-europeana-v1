import { withAuth } from "next-auth/middleware";

const authProxy = withAuth;

export default authProxy;
export const proxy = authProxy;

// /files/* serves the uploaded documents (public/files): without a session,
// to the sign-in page like the dashboard. The app reads them from disk and
// never by this URL.
export const config = { matcher: ["/dashboard", "/dashboard/:path*", "/files/:path*"] };
