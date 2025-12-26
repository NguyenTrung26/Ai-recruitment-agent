import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "");
    const isDev = process.env.NODE_ENV === "development";

    // Use configured backend URL in any environment when provided
    if (backendUrl) {
      return {
        beforeFiles: [
          {
            source: "/api/:path*",
            destination: `${backendUrl}/api/:path*`,
          },
        ],
      };
    }

    // Fallback to local only in development
    if (isDev) {
      return {
        beforeFiles: [
          {
            source: "/api/:path*",
            destination: "http://127.0.0.1:8080/api/:path*",
          },
        ],
      };
    }

    // No rewrite in production if backend URL not set
    return { beforeFiles: [] };
  },
};

export default nextConfig;
