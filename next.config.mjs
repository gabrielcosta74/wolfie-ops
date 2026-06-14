import path from "node:path";

const isDevelopment = process.env.NODE_ENV !== "production";
const isVercel = process.env.VERCEL === "1";
const outputFileTracingRoot = isVercel ? process.cwd() : path.join(process.cwd(), "..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot,
  async headers() {
    const cspDirectives = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
      "connect-src 'self' https: wss:",
      "frame-src 'self' https:",
      "object-src 'none'",
    ];

    if (!isDevelopment) {
      cspDirectives.push("upgrade-insecure-requests");
    }

    const headers = [
      {
        key: "Content-Security-Policy",
        value: cspDirectives.join("; "),
      },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];

    if (!isDevelopment) {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/:path*",
        headers,
      },
    ];
  },
};

export default nextConfig;
