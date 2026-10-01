import React from 'react';
import { Helmet } from 'react-helmet-async';
import AppRouter from './routes/Router.jsx';
import './styles/globals.css';
import { organizationJsonLd, websiteJsonLd } from './utils/structuredData.js';

// The prerendered homepage already carries these two blocks (written by
// scripts/prerender.mjs, marked data-xk-static-ld). Every other page drops
// that copy before rendering (inline script in index.html), so this adds
// them once wherever they're missing and never duplicates them.
const hasStaticSiteLd =
  typeof document !== 'undefined' && Boolean(document.querySelector('script[data-xk-static-ld]'));

function App() {
  return (
    <>
      {!hasStaticSiteLd && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(organizationJsonLd())}
          </script>
          <script type="application/ld+json">
            {JSON.stringify(websiteJsonLd())}
          </script>
        </Helmet>
      )}
      <AppRouter />
    </>
  );
}

export default App;
