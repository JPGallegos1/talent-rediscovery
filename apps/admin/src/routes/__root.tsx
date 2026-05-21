import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { SideNav, TopAppBar, MobileNav } from "../main";
import "../styles.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Talent Rediscovery" },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="min-h-screen bg-paper text-ink lg:h-screen lg:overflow-hidden">
          <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
            <SideNav />
            <div className="flex min-w-0 flex-1 flex-col lg:ml-[280px]">
              <TopAppBar />
              <MobileNav />
              <main className="custom-scrollbar min-w-0 flex-1 overflow-y-auto bg-paper px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
                <Outlet />
              </main>
            </div>
          </div>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
