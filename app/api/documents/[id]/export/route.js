import { requireAuthUser, toErrorResponse } from '@/modules/shared';
import {
  exportDocumentAsSdlxliffService,
  exportDocumentAsJsonService,
} from '@/modules/documents/export-service';

export const GET = async (req, { params }) => {
  try {
    const actorUser = await requireAuthUser();
    const { id } = await params;
    const format = req.nextUrl.searchParams.get('format') || 'sdlxliff';

    if (format === 'json') {
      const jsonData = await exportDocumentAsJsonService(id, actorUser);
      return Response.json(jsonData);
    }

    if (format === 'sdlxliff') {
      const sdlxliffContent = await exportDocumentAsSdlxliffService(id, actorUser);

      return new Response(sdlxliffContent, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="export-${id}.sdlxliff"`,
        },
      });
    }

    return toErrorResponse({
      code: 'INVALID_FORMAT',
      message: 'Invalid export format. Supported: sdlxliff, json',
    });
  } catch (error) {
    console.error('GET /api/documents/[id]/export failed:', error);
    return toErrorResponse(error);
  }
};
