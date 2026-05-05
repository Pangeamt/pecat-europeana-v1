import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  importTmFromFilesService,
  tmImportFormSchema,
} from "@/modules/memory/tm";

export const POST = async (req) => {
  try {
    const user = await requireAuthUser();
    const formData = await req.formData();
    const files = formData.getAll("file");
    const parsedForm = await tmImportFormSchema.validateAsync({
      tmId: formData.get("tm"),
      name: formData.get("name"),
      project: formData.get("project"),
      domain: formData.get("domain"),
      source: formData.get("source"),
      target: formData.get("target"),
    });

    const tmId = parsedForm.tmId || 0;
    const data = await importTmFromFilesService({
      files,
      tmId,
      form: parsedForm,
      actorUser: user,
    });
    return Response.json({ status: "success", data });
  } catch (error) {
    return toErrorResponse(error);
  }
};
