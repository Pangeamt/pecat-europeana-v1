import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import { listLanguagesService } from "@/modules/languages";

// The language pickers' catalog (DAAIT's, cached one hour server side).
export const GET = async () => {
  try {
    await requireAuthUser();
    return Response.json(await listLanguagesService());
  } catch (error) {
    return toErrorResponse(error);
  }
};
