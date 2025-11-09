export const demo_routes = Object.keys(
  import.meta.glob(`/src/routes/*demos*/*/+page*.{md,svelte}`),
).map((filename) => filename.split(`/`).slice(4, -1).join(`/`))
