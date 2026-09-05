# Local blog content

Markdown and MDX files are the canonical local source for the blog pipeline.

## Directories

- `briefs/` contains evidence requirements and article plans.
- `drafts/` contains work that is not publicly visible.
- `published/` contains approved or published article source.
- `archived/` contains retired source retained for provenance.

Every article starts with YAML frontmatter. The shared contract defines the lane,
post type, lifecycle status, author, purpose, commercial role, evidence level,
and source references. Source references must resolve against the source index
before an article can proceed.

The public loader exposes only `approved` and `published` articles. It rejects
unsafe slugs and does not use the Opinly integration.
