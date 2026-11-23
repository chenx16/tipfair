# TipFair — Product Requirements

## Problem
Small venues that pool tips split them by hand at the end of each shift. Rules vary, rounding errors
make shares not add up, staff can't see how their share was calculated, and some rules (e.g., giving
managers a share) break federal law without anyone noticing.

## Roles
| Role | Can do |
|---|---|
| OWNER | Create venue, invite users, assign roles, set pooling rules |
| MANAGER | Enter shift tips and hours, preview and approve splits, correct shifts (audited) |
| STAFF | View own shares, breakdowns, and history |

## Core Domain Rules (Split Engine)
Input: total tips in cents, and a list of entries `{ staffId, role, hours, points }`.

- **Weight** of each entry = `hours × points`. (Hours-only pooling = every role has 1 point.)
- **Base share** = `floor(total × weight / totalWeight)` in cents.
- **Leftover cents** (total − sum of base shares) go one cent at a time to entries with the
  largest fractional remainder; ties are broken by `staffId` ascending. This is deterministic.
- Entries with 0 hours get 0 cents.
- Errors: negative total, negative hours or points, all weights zero while total > 0,
  any entry with role MANAGER or OWNER.

## Feature 1 — Split Engine (built with TDD)
Acceptance criteria:
1. Splits by hours: $100.00 across 6h and 4h → 6000 and 4000 cents.
2. Splits by role points: server (1.0) and busser (0.5), equal hours → 2:1 ratio.
3. Sum of all shares always equals the total exactly.
4. $100.00 across 3 equal entries → 3334, 3333, 3333 (leftover cent to lowest staffId).
5. Total of 0 → every share is 0.
6. Zero-hour entries get 0.
7. Throws for negative values, all-zero weights with a positive total, or a MANAGER/OWNER entry.

## Feature 2 — Shift Split Preview (built with Explore → Plan → Implement → Commit)
A manager page where they enter a shift's total tips and each staff member's role and hours,
then see a preview table (name, hours, points, share in dollars) before approving.
Acceptance criteria:
1. Form validates inputs with Zod and shows field-level errors.
2. Preview uses the split engine; displayed shares add up to the total.
3. Invalid input (e.g., a manager in the list) shows a clear error instead of a table.

## Later Features (P3 sprints)
- Auth + roles, venue setup and invites
- Saved pooling rules per venue
- Shift approval, staff history view, audit log of corrections
- Plain-English rule drafting with Claude (owner approves before saving)

## Security Acceptance Criteria (Definition of Done)
- Every server action checks the user's role and venue membership.
- No secrets in the repo; `.env` is git-ignored.
- All inputs validated with Zod on the server.
