# `loading.tsx` boundary never resolves on the client (Next 15 / 16)

Minimal reproduction for a Next.js App Router bug: whenever the server actually
streams the `loading.tsx` fallback, the client never swaps it for the page
content. The skeleton stays on screen forever.

The whole app is four files under `app/`.

## Steps

```bash
npm install
npm run build
npm start
# open http://localhost:3000/slow
```

**Expected:** `LOADING` briefly, then `CONTENT-OK`.

**Actual:** `LOADING` stays forever. Measured still showing the fallback after
38 seconds.

Reproduces with `npm run dev` as well.

## What makes it happen

`app/slow/page.tsx` awaits for 50 ms. That is enough for the server to flush the
shell with the fallback before the segment is ready. A page that resolves fast
enough never streams a fallback at all, so it looks fine — which is why this is
easy to miss until one route gets slow.

## What the server sends is correct

The HTML response is complete and contains both the real content and React's
swap script:

```
$RC("B:0","S:0")
```

…byte-for-byte the same shape Next 14 emits, where it works.

## No error anywhere

- Nothing in the browser console.
- Every request returns 200.
- Nothing in the server log.
- React **does** hydrate — `__reactFiber$…` keys are present on `document.body`.

The content is in the DOM the whole time, inside the hidden `div#S:0` streaming
container. It is just never revealed.

## Version matrix

| variant | result |
| --- | --- |
| **next 14.2.35 + react 18.3.1** | ✅ renders immediately |
| next 15.5.27 + react 19.3.0 | ❌ stuck on fallback |
| next 16.4.0 + react 19.3.0 | ❌ stuck on fallback |
| next 16.5.0-canary.10 | ❌ stuck on fallback |
| next 16.4.0 + **react 18.3.1** | ❌ stuck on fallback |
| next 16.4.0, `next build --turbopack` (default) | ❌ stuck on fallback |
| next 16.4.0, `next build --webpack` | ❌ stuck on fallback |
| Node 24.10.0 | ❌ stuck on fallback |
| Node 26.4.0 | ❌ stuck on fallback |

Ruled out by the matrix: React 19 (16 + React 18 fails too), the bundler, and
the Node version. Tested in two separate Chromium browsers on the same machine,
with the same result, so it is not browser profile state either.

## Environment

- Windows 11 x64
- Node 24.10.0 and 26.4.0 (both)
- npm 11.17.0
