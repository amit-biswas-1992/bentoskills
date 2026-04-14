# bentoskills

Install UI/UX agent skills for [Claude Code](https://docs.claude.com/en/docs/claude-code) from [bentoskills.sh](https://bentoskills.sh).

```bash
npx bentoskills install design-critique
```

That drops `design-critique/` into `~/.claude/skills/`. Restart Claude Code and the skill is available.

## Commands

```bash
bentoskills list                            # show every skill in the registry
bentoskills search copy                     # substring search
bentoskills install design-critique         # install a skill
bentoskills install design-critique --force # overwrite if it already exists
bentoskills install design-critique --dir ./local-skills
```

## Where skills get installed

By default: `~/.claude/skills/<slug>/`

Override with `--dir <path>` or `CLAUDE_SKILLS_DIR=/path/to/skills`.

## Environment variables

| Variable                      | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `GITHUB_TOKEN`                | Lift GitHub API rate limit from 60/hr to 5000/hr               |
| `CLAUDE_SKILLS_DIR`           | Override default install directory                             |
| `BENTOSKILLS_REGISTRY_REPO`   | Use a different registry repo (format: `owner/name`)           |
| `BENTOSKILLS_REGISTRY_BRANCH` | Use a different registry branch (default: `main`)              |

## Contributing a skill

The CLI is a thin client over the [bentoskills-registry](https://github.com/amit-biswas-1992/bentoskills-registry) repo. To publish a skill, open a PR there with a new directory containing `skill.yaml` and `README.md`.

## License

MIT
