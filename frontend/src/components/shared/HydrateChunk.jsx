import React, { Suspense } from "react";

// Wraps one below-the-fold homepage section in its own Suspense boundary.
//
// The homepage is prerendered and hydrated. Without boundaries, hydrateRoot
// walks all ~900 elements in one task (a 250-500 ms block on a phone). React
// hydrates each Suspense boundary found in server-rendered HTML as a separate,
// lower-priority task and yields to the browser between them, so wrapping the
// sections turns that one block into ten short ones. scripts/prerender.mjs
// brackets each wrapper's content with the <!--$--> / <!--/$--> comments
// React's server renderer emits, which is how the client recognises a
// boundary. If one section ever fails to hydrate, only that section falls
// back to a client render instead of the whole page.
//
// .xk-cv adds content-visibility: auto, so the browser also skips style,
// layout and paint for sections that are still off screen.
function HydrateChunk({ children }) {
  return (
    <div data-xk-chunk="" className="xk-cv">
      <Suspense fallback={null}>{children}</Suspense>
    </div>
  );
}

export default HydrateChunk;
