import { NextRequest, NextResponse } from "next/server";

/**
 * Thin proxy for GitHub's OAuth device flow.
 *
 * github.com's OAuth endpoints do not send CORS headers, so the browser cannot
 * call them directly. Device flow uses a *public* client id and no client
 * secret, so this route holds no credentials: it only forwards the request.
 */

const CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ?? "";
// public_repo is enough to fork, push a branch and open a pull request
const SCOPE = "public_repo";

export const dynamic = "force-dynamic";

function noClient() {
  return NextResponse.json(
    {
      error:
        "GitHub is not configured on this deployment. Set NEXT_PUBLIC_GITHUB_CLIENT_ID to an OAuth app with device flow enabled.",
    },
    { status: 503 }
  );
}

/** Start a device authorization: returns the code the reader types on GitHub. */
export async function POST() {
  if (!CLIENT_ID) return noClient();

  const res = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, scope: SCOPE }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    return NextResponse.json(
      { error: data.error_description ?? "Could not start GitHub sign-in." },
      { status: 502 }
    );
  }
  return NextResponse.json({
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUri: data.verification_uri,
    interval: data.interval ?? 5,
    expiresIn: data.expires_in ?? 900,
  });
}

/** Poll for the access token once the reader has approved on GitHub. */
export async function PUT(req: NextRequest) {
  if (!CLIENT_ID) return noClient();

  const { deviceCode } = await req.json();
  if (typeof deviceCode !== "string" || !deviceCode)
    return NextResponse.json({ error: "Missing device code" }, { status: 400 });

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      device_code: deviceCode,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    }),
    cache: "no-store",
  });
  const data = await res.json();

  // still waiting on the reader, or asked to slow down: not an error
  if (data.error === "authorization_pending" || data.error === "slow_down")
    return NextResponse.json({ status: data.error });
  if (data.error)
    return NextResponse.json(
      { error: data.error_description ?? data.error },
      { status: 400 }
    );

  return NextResponse.json({ status: "ok", token: data.access_token });
}
