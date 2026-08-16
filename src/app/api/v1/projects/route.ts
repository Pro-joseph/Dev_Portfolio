import { loadProjectList, buildProjectListBatched, projectListResource } from "@/lib/resources";
import { resourceCollectionResponse, paginate } from "@/lib/http";
import { PAGE_SIZE_PUBLIC } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const featured =
    url.searchParams.get("featured") === "true" ||
    url.searchParams.get("featured") === "1";
  const search = url.searchParams.get("search")?.trim() ?? "";
  const perPage = Math.max(1, Number(url.searchParams.get("per_page")) || PAGE_SIZE_PUBLIC);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

  const { rows, total } = await loadProjectList({ featured, search, perPage, page });
  const projects = await buildProjectListBatched(rows);
  const data = projects.map(projectListResource);

  const paginator = paginate({ page, perPage, total, data, url: request.url });
  return resourceCollectionResponse(paginator);
}
