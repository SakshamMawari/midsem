import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const allowed = process.env.SITE_INDEXABLE === "true";
  return { rules: { userAgent: "*", allow: allowed ? "/" : [], disallow: allowed ? undefined : "/" } };
}
