# WorldPilot — architectural studio

The authoring viewport now uses a daylight pavilion, stone floor, a neutral circular work area, local reflection lighting, ACES tone mapping and restrained bloom. The toolbar switches between daylight and evening, resets the camera, and toggles the grid and labels. Materials have less metallic reflectance and GLB meshes cast and receive shadows.



Validation: production build, existing golden causal test using `node --import tsx src/tests/golden.test.ts`, browser checks of empty state, showroom asset loading, training creation and 390px responsive layout. Vite still reports large chunks from the existing 3D/XR dependencies.

Run locally: `npm run dev -- --host 127.0.0.1`.
