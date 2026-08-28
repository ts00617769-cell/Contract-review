import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ["", "/pricing", "/terms", "/privacy", "/refund"].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path === "" || path === "/pricing" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/pricing" ? 0.8 : 0.4,
  }));
}

