import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const authorization = request.headers.get("authorization");
  if (authorization) {
    const [scheme, encoded] = authorization.split(" ");
    if (scheme === "Basic" && encoded) {
      const credentials = atob(encoded);
      if (credentials.endsWith(`:${password}`)) return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Study Library"' }
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.svg).*)"]
};
