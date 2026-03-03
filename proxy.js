import { withAuth } from "next-auth/middleware";

const authProxy = withAuth;

export default authProxy;
export const proxy = authProxy;

export const config = { matcher: ["/dashboard", "/dashboard/:path*"] };
