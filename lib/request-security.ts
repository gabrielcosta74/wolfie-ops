import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function normalizeOrigin(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
}

function getExpectedOriginFromValues(values: {
  host: string | null;
  protocol: string | null;
}) {
  const host = values.host?.trim();
  if (!host) return null;

  const protocol = values.protocol?.trim() || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function requireTrustedOriginForAction() {
  const headerStore = await headers();
  const expectedOrigin = getExpectedOriginFromValues({
    host:
      headerStore.get("x-forwarded-host") ??
      headerStore.get("host"),
    protocol: headerStore.get("x-forwarded-proto"),
  });

  if (!expectedOrigin) {
    throw new Error("Unable to validate request origin.");
  }

  const origin = normalizeOrigin(headerStore.get("origin"));
  const referer = normalizeOrigin(headerStore.get("referer"));
  const candidate = origin ?? referer;

  if (!candidate || candidate !== expectedOrigin) {
    throw new Error("Untrusted request origin.");
  }
}

export function rejectUntrustedOriginForRoute(req: NextRequest) {
  const expectedOrigin = getExpectedOriginFromValues({
    host: req.headers.get("x-forwarded-host") ?? req.headers.get("host"),
    protocol: req.headers.get("x-forwarded-proto"),
  });

  if (!expectedOrigin) {
    return NextResponse.json(
      { ok: false, message: "Unable to validate request origin." },
      { status: 400 },
    );
  }

  const origin = normalizeOrigin(req.headers.get("origin"));
  const referer = normalizeOrigin(req.headers.get("referer"));
  const candidate = origin ?? referer;

  if (!candidate || candidate !== expectedOrigin) {
    return NextResponse.json(
      { ok: false, message: "Untrusted request origin." },
      { status: 403 },
    );
  }

  return null;
}

export function checkRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const existing = rateLimitBuckets.get(params.key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + params.windowMs;
    rateLimitBuckets.set(params.key, {
      count: 1,
      resetAt,
    });
    return { ok: true, remaining: params.limit - 1, resetAt };
  }

  if (existing.count >= params.limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  rateLimitBuckets.set(params.key, existing);
  return {
    ok: true,
    remaining: params.limit - existing.count,
    resetAt: existing.resetAt,
  };
}

function hashRateLimitKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

export async function checkRateLimitPersisted(params: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const hashedKey = hashRateLimitKey(params.key);

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("take_ops_rate_limit", {
      p_bucket: hashedKey,
      p_limit: params.limit,
      p_window_ms: params.windowMs,
    });

    if (error) {
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      throw new Error("Missing rate limit result.");
    }

    return {
      ok: Boolean(row.ok),
      remaining: Number(row.remaining ?? 0),
      resetAt: new Date(String(row.reset_at)).getTime(),
    };
  } catch (error) {
    console.error("Falling back to in-memory rate limit:", error);
    return checkRateLimit({
      key: hashedKey,
      limit: params.limit,
      windowMs: params.windowMs,
    });
  }
}
