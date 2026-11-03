# Y.M Store — Cinematic Scroll Experience

A scroll-driven storytelling site for **Y.M Store**: a fixed WebGL fabric centerpiece, pinned narrative chapters, kinetic typography and a live HUD. Store content comes from [`mr-h12/ym-store`](https://github.com/mr-h12/ym-store).

## Stack
- Next.js 15 (App Router) with TypeScript
- Tailwind CSS v4: tokens and fluid `clamp()` type live in `app/globals.css`
- Lenis smooth scroll, synced to the GSAP ticker
- GSAP, ScrollTrigger, SplitText and `@gsap/react`
- three, `@react-three/fiber` and `@react-three/drei`: a procedural fabric shader, with an optional `.glb` swap
- lucide-react

## Run
```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

To set up a fresh project with the same dependencies:
```bash
npm install next@15 react@19 react-dom@19 three @react-three/fiber@9 @react-three/drei@10 gsap @gsap/react lenis lucide-react
npm install -D typescript @types/react @types/react-dom @types/node @types/three tailwindcss@4 @tailwindcss/postcss eslint eslint-config-next @eslint/eslintrc
```

## Architecture
| Layer | File | Role |
|---|---|---|
| 0 | `components/scene/*` | Fixed full-screen R3F canvas (`frameloop="never"`), advanced from `gsap.ticker` |
| 1 | `components/story/*` | Tall track with 5 pinned chapters and the master scrub timeline that writes the scene state |
| 2 | `components/hud/HUD.tsx` | Progress bar, `0X // 05` indicator, telemetry ticker, quick-jump nav |
| — | `components/Preloader.tsx` | 0–100 loader that waits for fonts and shader compilation |
| — | `components/providers/SmoothScroll.tsx` | Lenis → `ScrollTrigger.update` on the same `gsap.ticker` tick as the WebGL render |

All of these talk through one mutable object, `lib/scroll-state.ts`. It is written by GSAP and Lenis and read by the frame loop, without any React re-renders.

## Editing content
- **All store data** is in `lib/store-data.ts`: brand, social links, policies, categories, products and palette.
- **Chapter copy and camera keyframes** are in `lib/chapters.ts`.
- **Fabric layers** (colour, weave, label) are in `lib/scene-config.ts`.

### Using your own 3D model
1. Put the file at `public/models/garment.glb`.
2. In `lib/scene-config.ts`, set `MODEL_URL = "/models/garment.glb"`.

Each direct child mesh of the model is treated as a layer and gets the same explode, fan and focus choreography.

## ⚠️ Placeholders to confirm with the store owner
The source repo marks these as placeholders:
- WhatsApp number (`201000000000`)
- All 24 products and their prices (EGP)
- Shipping fee (EGP 75), free-shipping threshold (EGP 1,500) and delivery estimate (2–4 working days)
- 14-day returns window, payment options, delivery cities
- Tagline

Already confirmed: the store name **Y.M Store**, Instagram [@y_m_storee](https://www.instagram.com/y_m_storee) and the [Facebook page](https://www.facebook.com/share/1SEgUHRtpi/).
