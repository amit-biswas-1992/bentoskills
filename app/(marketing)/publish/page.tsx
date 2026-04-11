export default function PublishPage() {
  return (
    <article className="prose prose-zinc max-w-none dark:prose-invert">
      <h1>Publish a skill</h1>
      <p>bentoskills.sh is backed by a public GitHub registry. To publish:</p>
      <ol>
        <li>
          Fork{" "}
          <a href="https://github.com/bentoskills/registry">
            <code>bentoskills/registry</code>
          </a>
          .
        </li>
        <li>
          Add a folder under <code>skills/&lt;slug&gt;/</code> containing <code>skill.yaml</code> and{" "}
          <code>README.md</code>.
        </li>
        <li>
          Add an entry to <code>registry.json</code>.
        </li>
        <li>Open a pull request.</li>
      </ol>
      <h2>
        <code>skill.yaml</code> schema
      </h2>
      <pre>
        <code>{`slug: design-critique           # required, [a-z0-9-]+
name: Design Critique           # required
tagline: Get structured ...     # required, ≤140 chars
version: 1.2.0                  # required, semver
author: alice                   # required, GitHub login
category: critique              # one of: accessibility | critique | copy | handoff | research | system
tags: [ui, feedback]            # optional
license: MIT                    # optional SPDX id
homepage: https://...           # optional
publishedAt: 2026-03-01         # optional ISO date`}</code>
      </pre>
    </article>
  );
}
