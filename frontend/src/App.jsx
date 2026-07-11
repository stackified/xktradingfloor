import React from 'react';
import { Helmet } from 'react-helmet-async';
import AppRouter from './routes/Router.jsx';
import './styles/globals.css';
import { organizationJsonLd, websiteJsonLd } from './utils/structuredData.js';

function App() {
  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(organizationJsonLd())}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(websiteJsonLd())}
        </script>
      </Helmet>
      <AppRouter />
    </>
  );
}

export default App;
