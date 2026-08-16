import { siteResource } from "./resources";
import type { SiteData } from "./types";
import { getSiteSettings } from "./site-settings";
import type { SiteSettings } from "./site-settings";

export { getSiteSettings };
export type { SiteSettings };

export async function loadSiteSettings(): Promise<SiteSettings> {
  return getSiteSettings((await siteResource()) as unknown as SiteData);
}