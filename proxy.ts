import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Pages anyone can open. Everything else needs a signed-in user.
// (This is only the first check. Supabase RLS decides what data each user can see.)
const isPublic = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/s/(.*)", // shared recipe links
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
