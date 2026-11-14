import { useState } from "react";
import { AppProvider } from "@shopify/polaris";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";

import appStylesHref from "./styles/app.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: appStylesHref }];

export default function App() {
  const [polarisLocale] = useState({});

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <AppProvider i18n={polarisLocale as any}>
          <Outlet />
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
