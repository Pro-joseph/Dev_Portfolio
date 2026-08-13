export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function notFound(message = "The requested record was not found."): Response {
  return json({ message }, 404);
}

export function unauthorized(message = "Unauthenticated."): Response {
  return json({ message }, 401);
}

export function forbidden(message = "Forbidden."): Response {
  return json({ message }, 403);
}

export function validationError(errors: Record<string, string[]>): Response {
  return json(
    { message: "The given data was invalid.", errors },
    422
  );
}

// ------------------------------------------------------------- pagination

export interface Paginator {
  current_page: number;
  data: unknown[];
  first_page_url: string | null;
  from: number | null;
  last_page: number;
  last_page_url: string | null;
  links: { url: string | null; label: string; page: number | null; active: boolean }[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface PaginateParams {
  page: number;
  perPage: number;
  total: number;
  data: unknown[];
  /** full request URL (used to rebuild link URLs preserving the query string) */
  url: string;
  /** number of page links on each side of the current page (Laravel default 3) */
  onEachSide?: number;
}

function urlToPath(url: string): string {
  const u = new URL(url);
  return u.pathname;
}

function addPage(url: string, page: number): string {
  const u = new URL(url);
  u.searchParams.set("page", String(page));
  return u.toString();
}

/** Laravel LengthAwarePaginator serialization without the ResourceCollection wrapper. */
export function paginate({
  page,
  perPage,
  total,
  data,
  url,
  onEachSide = 3,
}: PaginateParams): Paginator {
  const lastPage = Math.max(1, Math.ceil(total / (perPage || 1)));
  const currentPage = Math.min(Math.max(1, page), lastPage);

  const urlParams = new URL(url);
  urlParams.searchParams.set("page", String(currentPage));

  const links: Paginator["links"] = [];
  const add = (target: number | null, label: string, active: boolean) => {
    links.push({
      url: target === null ? null : addPage(url, target),
      label,
      page: target,
      active,
    });
  };

  add(currentPage - 1, "&laquo; Previous", false);
  const start = Math.max(1, currentPage - onEachSide);
  const end = Math.min(lastPage, currentPage + onEachSide);
  for (let i = start; i <= end; i++) {
    add(i, String(i), i === currentPage);
  }
  add(currentPage + 1, "Next &raquo;", false);

  return {
    current_page: currentPage,
    data,
    first_page_url: addPage(url, 1),
    from: total === 0 ? null : (currentPage - 1) * perPage + 1,
    last_page: lastPage,
    last_page_url: addPage(url, lastPage),
    links,
    next_page_url: currentPage >= lastPage ? null : addPage(url, currentPage + 1),
    path: urlToPath(url),
    per_page: perPage,
    prev_page_url: currentPage <= 1 ? null : addPage(url, currentPage - 1),
    to: total === 0 ? null : Math.min(currentPage * perPage, total),
    total,
  };
}

function resourceLinkCollection(p: Paginator) {
  return {
    first: p.first_page_url,
    last: p.last_page_url,
    prev: p.prev_page_url,
    next: p.next_page_url,
  };
}

/** JsonResource::collection($paginator)->response() shape used by public /projects. */
export function resourceCollectionResponse(paginator: Paginator): Response {
  return json({
    data: paginator.data,
    links: resourceLinkCollection(paginator),
    meta: {
      current_page: paginator.current_page,
      from: paginator.from,
      last_page: paginator.last_page,
      links: paginator.links,
      path: paginator.path,
      per_page: paginator.per_page,
      to: paginator.to,
      total: paginator.total,
    },
  });
}

// ------------------------------------------------------------- validation

export type Rule = { required?: boolean; email?: boolean; rules?: string[] };

export function validatePayload(
  payload: Record<string, unknown>,
  rules: Record<string, Rule>
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const [field, rule] of Object.entries(rules)) {
    const value = payload[field];
    const isMissing = value === undefined || value === null || value === "";
    if (rule.required && isMissing) {
      errors[field] = [`The ${field.replace(/_/g, " ")} field is required.`];
    } else if (rule.email && !isMissing && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
      errors[field] = [
        `The ${field.replace(/_/g, " ")} field must be a valid email address.`,
      ];
    }
  }
  return errors;
}