---
name: Postgres Dollar-Quoting in migrate.ts
description: The Edit tool corrupts $$ dollar-quoting in SQL strings inside JS template literals; use tagged dollar-quoting like $oe$ instead.
---

# Postgres Dollar-Quoting in migrate.ts

## Rule
Use **tagged dollar-quoting** (`$oe$...$oe$`) in all DO blocks inside `lib/db/src/migrate.ts` instead of bare `$$...$$.`

**Why:** The Edit tool (or its JSON encoding layer) silently collapses `$$` to `$` inside JS template literal strings. This produces a PostgreSQL syntax error (`syntax error at or near "$"`) at runtime. Using a tag (`$oe$`) avoids any ambiguity with the `$$` sequence.

**How to apply:** Whenever adding a new `DO ... END` block to migrate.ts, write `DO $oe$ BEGIN ... END $oe$` — never bare `$$`. Use WriteFile (not Edit) when rewriting large sections to avoid the corruption risk.
