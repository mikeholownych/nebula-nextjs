# Clay Component Workbench

Status: implemented.

The live workbench is the Next.js Storybook configuration under `customer-portal/.storybook/`, with one story file for each of the 28 reviewed shared components. See `customer-portal/stories/` and run `npm run storybook` from `customer-portal`.

The build-time regression tripwire is `customer-portal/scripts/check-banned-strings.mjs`, exposed as `npm run check:content` and wired into CI.

Evidence range: `c697f16f..8a77b63b` on `feat/clay-component-workbench`.
