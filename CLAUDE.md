# Notes for Claude

## Chess: keep the manual current

The chess app (`apps/chess`) has a manual in `docs/chess-replica/manual/`.
`user-guide.md` is the source; `user-guide.html` is generated from it and
must never be edited by hand.

Any change to `apps/chess` that a user would notice (a new or removed screen,
button, setting, label, limit or default, or a change in how a feature
behaves) updates `user-guide.md` in the same commit. If the change touches a
chapter that is still marked "to come", add a line under that chapter's
headings instead of writing the whole chapter. Then regenerate the HTML with
`docs/chess-replica/manual/build.sh` (needs pandoc) and republish it to the
same artifact, https://claude.ai/artifact/6MmqseJwsbt4PwDudr1Zy1, by passing
that URL. Say in the commit message which chapters changed.

The guide ends with a "Known issues" table. When a fix lands for one of
them, remove its row and correct the chapter's "Watch out" list.

Pure refactors, tests and build changes don't need a manual update.
