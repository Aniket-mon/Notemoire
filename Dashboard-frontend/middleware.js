import { NextResponse } from "next/server";

export function middleware(req) {
  const ua = req.headers.get("user-agent") || "";

  const blockedAgents = [
    "curl",
    "python",
    "wget",
    "nikto",
    "sqlmap",
    "nmap",
    "scanner",
    "bot"
  ];

  for (const agent of blockedAgents) {
    if (ua.toLowerCase().includes(agent)) {
      return new Response("Blocked by firewall", { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*"
};