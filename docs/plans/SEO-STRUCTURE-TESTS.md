# SEO Structure Unit Test Proposal

## Purpose
Define unit tests for the SEO workstream, ensuring alignment with `@rianell/pwa-webapp` output paths defined in `architecture-standard.md`.

## Test Scenarios

1. **Sitemap Generation**
   - Verify `sitemap.xml` is generated at `/public/sitemap.xml`.
   - Ensure all routes from `architecture-standard.md` are included.

2. **Robots.txt Compliance**
   - Verify `robots.txt` exists at `/public/robots.txt`.
   - Check `Disallow` rules match architecture constraints.

3. **Meta Tag Injection**
   - Validate `<title>` and `<meta name="description">` are present in SSR output.
   - Ensure Open Graph tags (`og:title`, `og:image`) are dynamically set.

4. **Canonical URLs**
   - Verify `<link rel="canonical">` matches the current route exactly.
   - Prevent duplicate content issues by normalizing query parameters.

5. **Pre-rendered Output Paths**
   - Confirm static HTML files for key routes exist in `/dist/seo/`.
   - Match path structure to `@rianell/pwa-webapp` build output directory.
