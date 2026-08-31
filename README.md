# ValueWise Frontend

A static web frontend for the ValueWise smartphone recommendation backend.

## Connect it to the API

Open `app.js` and change:

```js
const API_BASE = window.VALUEWISE_API_URL || 'https://valuewise-api.onrender.com';
```

to the real Render URL of your deployed backend, for example:

```js
const API_BASE = 'https://valuewise-api-xxxx.onrender.com';
```

## Run locally

Because this is a static site, you can use any local static server, e.g.:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500`.

## Deploy

The folder can be deployed directly to Netlify, Vercel, Cloudflare Pages, or GitHub Pages. No build command is required.
