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
      const { text, skipped } = await exportDocumentAsSdlxliffService(id, actorUser, {
        partial: req.nextUrl.searchParams.get('partial') === '1',
      });

      return new Response(text, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="export-${id}.sdlxliff"`,
          // Segments with a translation that were not written (tags that do not
          // match the source): the UI warns the reviewer.
          'X-Pecat-Skipped-Segments': String(skipped),
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
