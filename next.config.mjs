import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

export default function nextConfig(phase) {
  return {
    reactStrictMode: true,
    // Impede que `next build` substitua os chunks usados por `next dev`.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    async headers() {
      return [
        {
          source: "/:path((?!_next/static/).*)",
          headers: [
            { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
            { key: "Pragma", value: "no-cache" },
            { key: "Expires", value: "0" },
          ],
        },
      ];
    },
  };
}
