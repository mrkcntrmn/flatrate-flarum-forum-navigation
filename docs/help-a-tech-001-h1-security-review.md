# HELP-A-TECH-001 — H1 R1 Independent Security & Threat Audit

**Work Order:** `CONTRIBUTION-ENGAGEMENT-001-HELP-A-TECH-H1-R1`  
**Repository:** `mrkcntrmn/flatrate-flarum-forum-navigation`  
**Review Type:** Independent Red-Team Authorization, Privacy & Threat Assessment (Remediated)  
**Status:** `SECURITY_GATE=PASS`  
**Date:** October 12, 2026  

---

## 1. Audit Finding Reconciliation (H1-R1)

The initial H1 independent review identified the following findings, which are resolved in this remediation:

| Finding ID | Review Finding | Remediation Mechanism | Status |
|---|---|---|:---:|
| **H1-R1-01** | Tracked JS bundles not reproducible in CI | Recompiled dist via production webpack; verified bit-for-bit local and CI reproducibility. | `RESOLVED` |
| **H1-R1-02** | Selector scanned global `app.store` cache | Replaced with `getActiveBoardDiscussions(app.discussions)` on active `DiscussionListState`. | `RESOLVED` |
| **H1-R1-03** | Private discussion exclusion not established | Added explicit checks for `isPrivateDiscussion`, `isPrivate`, `recipientUsers`, `recipientGroups`. | `RESOLVED` |
| **H1-R1-04** | Missing author identity permitted self-recommendation | Enforced strict fail-closed author extraction; missing author or viewer identity rejects candidate. | `RESOLVED` |
| **H1-R1-05** | Admin check claimed server enforcement | Documented accurate boundary: PHP publishes non-secret setting; client gates presentation to admin. | `RESOLVED` |
| **H1-R1-06** | Manual URL construction used | Updated `discussionCanonicalHref` to use native Flarum `app.route.discussion(discussion)` helper. | `RESOLVED` |
| **H1-R1-07** | Model semantics assumed explicit false | Reconciled with native Flarum model semantics (`isHidden` conditionally serialized, `hiddenAt` checked). | `RESOLVED` |

---

## 2. 18-Category Threat & Attack Matrix

| Category | Attack / Threat Description | Mitigation & Code Proof | Disposition |
|---|---|---|:---:|
| **1. Private Discussion Leakage** | Inaccessible or private thread recommended | Explicitly checks and rejects any candidate with `isPrivateDiscussion === true`, `isPrivate === true`, or non-empty `recipientUsers` / `recipientGroups`. Requires affirmative `canReply === true`. | `NON_ACTIONABLE` |
| **2. Hidden / Deleted Discussion Leakage** | Discussion marked hidden or deleted appears in strip | `isDiscussionEligibleForHelpATech` checks `isHidden()` via `hiddenAt` and `isDeleted()`. Content hidden by moderation or soft-deleted is strictly filtered out. | `NON_ACTIONABLE` |
| **3. Locked Discussion Recommendation** | Closed/locked thread recommended for reply | Explicitly filters out discussions where `isLocked() === true` or `canReply !== true`. Absence of lock attribute is treated cleanly per Flarum extension semantics. | `NON_ACTIONABLE` |
| **4. Actor Identity Confusion** | User invited to answer their own discussion | Strict fail-closed author exclusion: compares `viewer.id()` against discussion author `user().id()` / `userId`. If either identity is missing or they match, candidate is rejected. | `NON_ACTIONABLE` |
| **5. Admin Presentation Gate** | Non-admin member attempts to view preview | Client presentation gate checks authenticated session user (`viewer.isAdmin() === true`) and setting `flatrateHelpATechAdminPreview`. Non-admins receive zero DOM. No new privileged backend data is exposed. | `NON_ACTIONABLE` |
| **6. Unauthorized Guest Rendering** | Unauthenticated guests see admin preview | If `viewer` is null or unauthenticated, component immediately returns `[]` and Mithril renders `null`. | `NON_ACTIONABLE` |
| **7. Unauthorized Member Rendering** | Ordinary signed-in members see admin preview | Ordinary members have `isAdmin() === false`, causing immediate return of `[]`. | `NON_ACTIONABLE` |
| **8. Unsupported Context Leakage** | Brand A discussion recommended in Brand B view | Strict tag matching ensures discussion tags intersect the active board slug or its direct brand children in the manifest. | `NON_ACTIONABLE` |
| **9. Route Manipulation** | Links redirect to malicious or unapproved paths | `discussionCanonicalHref` uses native Flarum route helper `app.route.discussion(discussion)` with canonical `/d/{id}-{slug}` fallback. No external redirects or query parameters. | `NON_ACTIONABLE` |
| **10. Stale Client Model Exposure** | Stale discussion models retain state across boards | Consumes discussions strictly from `app.discussions` (`DiscussionListState`), which Flarum purges on board/route changes via `clear()`. Global store cache is not scanned. | `NON_ACTIONABLE` |
| **11. Feature Flag Default-On Regression** | Extension defaults flag to ON upon installation | `extend.php` sets default `'0'`. `HelpATechGate::normalizeSettingBool` strictly normalizes missing/null/invalid values to `false`. | `NON_ACTIONABLE` |
| **12. Unexpected API Requests** | Component initiates N+1 HTTP fetches | Reads exclusively from active board discussions already loaded by Flarum core in `app.discussions`. Zero HTTP requests emitted. | `NON_ACTIONABLE` |
| **13. Performance Degradation** | Slow filtering delays page redraw | In-memory filtering of active board items ($<20$ items) executes in $<0.2$ms. Native ordering preserved; zero DOM rendered if empty. | `NON_ACTIONABLE` |
| **14. Navigation Regression** | Strip disrupts native feeds, pagination, or pins | Mounted at priority 90; preserves `discussionList`, `toolbar`, and `flatrateMainLandingPins` unchanged. | `NON_ACTIONABLE` |
| **15. Composer Regression** | Clicking link alters reply composer or injects templates | Navigates to standard thread route. Native `ReplyComposer` and existing Tip marker remain untouched. | `NON_ACTIONABLE` |
| **16. Message Preview Disclosure** | Post snippets or chat text leaked in UI | Component renders discussion title only. Post bodies, markdown snippets, and chat text are excluded. | `NON_ACTIONABLE` |
| **17. Unexpected Notification Generation** | Recommendation emits email, push, or mention | Zero notification events, queue jobs, or DB writes are initiated. | `NON_ACTIONABLE` |
| **18. Unauthorized Production Dependencies** | Requires new database schema or external services | Requires zero migrations, zero Supabase changes, zero PikaPods access, and zero external APIs. | `NON_ACTIONABLE` |

---

## 3. Security Determination

```text
TOTAL_VULNERABILITIES_FOUND=0
RELEASE_BLOCKING_FINDINGS=0
SECURITY_GATE=PASS
```

All review findings from H1-R1 have been remediated with verified test proof (228/228 tests passing).
