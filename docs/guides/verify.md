# make verify

One command for the checks CI runs, on the scope you name. CI stays the
verdict; `make verify` is the fast local answer before you push. The runner is
`scripts/verify.mjs`.

```sh
make verify                                      # the checks CI runs, on what you changed
node scripts/verify.mjs --changed                # only the files changed against origin/main
node scripts/verify.mjs --changed --tier fast    # only the fast checks
node scripts/verify.mjs --list                   # the plan: which checks would run; runs nothing
```

Every `scripts/check-*.mjs` and every `scripts/*.test.mjs` suite runs on its
own, with no list to update: a new repo check is picked up by its file name.
`--list` prints the current checks and the command each runs.

A failing check is fixed, never silenced (CODE-25). The rule ids each check
enforces are in [rules-index.md](../guidelines/rules-index.md).
