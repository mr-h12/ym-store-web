import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Preloader } from "@/components/Preloader";
import { SceneCanvas } from "@/components/scene/SceneCanvas";
import { HUD } from "@/components/hud/HUD";
import { StoryTrack } from "@/components/story/StoryTrack";

/**
 * Layer stack:
 *   z-0   SceneCanvas  — fixed full-screen WebGL (Layer 0)
 *   z-10  StoryTrack   — tall scrollable narrative with pinned chapters (Layer 1)
 *   z-40  HUD          — fixed telemetry overlay (Layer 2)
 *   z-50  Preloader    — cinematic loader, removed once ready
 *   z-60  grain        — film grain
 */
export default function Home() {
  return (
    <SmoothScroll>
      <SceneCanvas />
      <StoryTrack />
      <HUD />
      <Preloader />
      <div aria-hidden className="grain" />
    </SmoothScroll>
  );
}
