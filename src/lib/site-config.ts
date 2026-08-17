import { siteResource } from "./resources";
import type { SiteData } from "./types";
import { getSiteSettings } from "./site-settings";
import type { SiteSettings } from "./site-settings";

export { getSiteSettings };
export type { SiteSettings };

export async function loadSiteSettings(locale?: string): Promise<SiteSettings> {
  return getSiteSettings(
    (await siteResource(locale)) as unknown as SiteData,
    locale
  );
}