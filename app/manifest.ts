import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "契約哨兵",
    short_name: "契約哨兵",
    description: "給台灣接案者的合約風險檢查工具",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#18181b",
    lang: "zh-Hant",
    icons: [{ src: "/favicon.ico", sizes: "256x256", type: "image/x-icon" }],
  };
}

