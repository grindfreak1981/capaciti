import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertOwnsCompanyResource, getCurrentUser, ForbiddenError } from "@/lib/auth";
import { fileStorage } from "@/domain/files/storage";

/** Authenticated, ownership-checked file download. Uploaded technical
 * drawings are never served from a public path — this route is the only
 * way to read one, and it enforces the same company-ownership rule as
 * every other RFQ-scoped resource. */
export async function GET(_request: Request, { params }: { params: { fileId: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const file = await prisma.rfqFile.findUnique({
    where: { id: params.fileId },
    include: { rfq: true },
  });
  if (!file) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    assertOwnsCompanyResource(user, file.rfq.companyId);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    throw err;
  }

  const buffer = await fileStorage.read(file.storageKey);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
