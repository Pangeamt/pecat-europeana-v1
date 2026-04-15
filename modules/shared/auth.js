import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { HttpError } from "./http-error";

export async function requireAuthUser() {
  const authValue = await getServerSession(authOptions);
  const user = authValue?.user;

  if (!user) {
    throw new HttpError(401, "Unauthorized");
  }

  return user;
}

