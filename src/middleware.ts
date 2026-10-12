import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth cookie on navigation so server routes see a
 * valid session. No-op when Supabase env vars are absent.
 */
/**
 * One address for the guide. Production used to answer on several
 * *.vercel.app aliases; every one of them now redirects to the real domain so
 * links, bookmarks and search results all land in the same place. Preview
 * deployments are left alone so pull requests can still be checked.
 */
const CANONICAL_HOST = "usapho.one";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0];
  if (
    process.env.VERCEL_ENV === "production" &&
    host &&
    host !== CANONICAL_HOST
  ) {
    const target = request.nextUrl.clone();
    target.protocol = "https:";
    target.host = CANONICAL_HOST;
    target.port = "";
    return NextResponse.redirect(target, 308);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    // everything except static assets and image files
    "/((?!_vercel|_next/static|_next/image|favicon.ico|icon.svg|videos|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|mp4)$).*)",
  ],
};
