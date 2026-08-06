# Clay Component Workbench — Follow-up

Status: deferred from the remediation branch.

The Clay review identified the absence of a component workbench for the shared UI library. The remediation pass intentionally did not introduce Storybook or a replacement runtime because the repository has no existing workbench dependency or configuration.

## Acceptance criteria for the follow-up

- Add a Next-compatible component workbench or Storybook/Ladle setup.
- Add stories/examples for every shared component, including at least Button, Input, CookieConsent, and FindingCallout.
- Cover default, hover, active, focus-visible, disabled/loading, error, keyboard, reduced-motion, dark/light, and responsive states where applicable.
- Keep the workbench outside the public marketing funnel and include a CI build check.

Tracking marker: `TODO(clay-review): implement component workbench before the next design-system review.`
