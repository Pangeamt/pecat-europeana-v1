import { segmentTexts } from "@/lib/utils";
import { toErrorResponse } from "@/modules/shared";
import { fileDownloadQuerySchema } from "@/modules/files/schemas";
import { buildProjectDownloadService } from "@/modules/files/service";

export const GET = async (req) => {
  try {
    const { uuid, projectId } = await fileDownloadQuerySchema.validateAsync(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const fileResponse = await buildProjectDownloadService({ uuid, projectId });
    return new Response(fileResponse.body, { headers: fileResponse.headers });
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const POST = async (req) => {
  try {
    const segmentedTexts = await segmentTexts("en", [
      "The video shows the first five minutes of the film. Film content: In the 17th century on Grieshuus Palace in Holstein: The old Burgherr has designated his son Hinrich as heir, while the younger son Detlef is studying law in the city. One day, Bärbe, the daughter of the serf Owe Heiken is attacked by soldiers, Hinrich can save her. He falls in love with her and wants to marry her against the will of the father. But during this dispute the father dies. Now the struggle between the unequal brothers for the inheritance begins. Detlef claims Grieshuus and tries to get Hinrich and Bärbe apart. Bärbe, who is pregnant, gives birth to the child too soon due to the excitement and dies. Hinrich then strikes the brother and flees. The young son is lovingly raised by the servant. However, Gesine, Detlef’s widow, repeatedly tries to tear Grieshuus. Hinrich returns to his homeland unrecognized and succeeds in liberating his child from the hands of Gesine.",
    ]);
    return Response.json({
      texts: segmentedTexts,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
};
