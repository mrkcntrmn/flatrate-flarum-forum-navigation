# HELP-A-TECH-001 — H1 R1 Admin-Preview Contract & Rollout Governance

**Work Order:** `CONTRIBUTION-ENGAGEMENT-001-HELP-A-TECH-H1-R1`  
**Parent Work Order:** `FLATRATE-PRODUCT-ENGAGEMENT-001-R9.1`  
**Repository:** `mrkcntrmn/flatrate-flarum-forum-navigation`  
**Document Class:** `PREVIEW_CONTRACT_AND_ROLLOUT_GOVERNANCE`  
**Status:** `DEFAULT_OFF_SOURCE_ONLY_REMEDIATED`  
**Date:** October 12, 2026  

---

## 1. Operating Contract

This contract defines the operational controls for the **Help a Tech** admin preview prototype.

### 1.1 Setting Key & Defaults
```text
SETTING_KEY=flatrate-forum-navigation.help_a_tech_admin_preview
DEFAULT_VALUE=0 (false)
NORMALIZATION=fail_closed
SERIALIZER_ATTRIBUTE=flatrateHelpATechAdminPreview
PRESENTATION_GATE=client_admin_check
DATA_SOURCE=active_board_discussion_list (DiscussionListState)
MAX_RESULTS=3
ORDERING=native_board_order (preserves active board sort)
```

### 1.2 Authorization & Boundary Architecture
1. **Server Setting Publication:** The PHP serializer (`HelpATechSettingsAttribute`) publishes `flatrateHelpATechAdminPreview` as a non-secret forum attribute. It does not perform privileged data filtering on the backend.
2. **Actor Authorization:** Flarum core authorizes the underlying discussion records delivered to the client for the current actor and active board.
3. **Client Presentation Gate:** Frontend logic verifies that the active session user has administrator privileges (`viewer.isAdmin() === true`) and that `adminPreviewEnabled === true`. If either is false, zero DOM is rendered (`return null`).
4. **Data Isolation:** Consumes discussions exclusively from the active board's `DiscussionListState` (`getActiveBoardDiscussions(app.discussions)`). No new API endpoints, database queries, or global store scans are performed.

### 1.3 Authorization Matrix
| Viewer Identity | Setting = 0 (Default) | Setting = 1 |
|---|:---:|:---:|
| **Guest** | Hidden (`null`) | Hidden (`null`) |
| **Ordinary Member (Group 3)** | Hidden (`null`) | Hidden (`null`) |
| **Beta Tester (Non-Admin)** | Hidden (`null`) | Hidden (`null`) |
| **Administrator (Group 1)** | Hidden (`null`) | **Visible** (if 1–3 eligible items exist in active board) |

---

## 2. Multi-Stage Lifecycle Gates

| Phase | Description | Activation Condition | Status |
|---|---|---|:---:|
| **H0 — Feasibility** | Source architecture & inventory review | Merged via PR #1273 | `COMPLETE` |
| **H1 — Source Prototype** | Default-OFF prototype, unit/security tests, draft PR #99 | Remediated under H1-R1 | `REMEDIATED_QUALIFIED` |
| **H2 — Admin Preview Qualification** | Visual/interaction acceptance in staging | Requires separate owner approval | `PENDING_OWNER_DECISION` |
| **H3 — Beta Tester Evaluation** | Usability and initial contribution measurement | Requires separate owner approval | `GATED` |
| **H4 — Member Rollout** | Bounded experiment with cohort measurement | Requires separate owner approval | `GATED` |
| **H5 — General Availability** | Production wide rollout | Requires separate owner approval | `GATED` |

---

## 3. Production Boundaries

```text
PRODUCTION_DEPLOYMENT=HOLD (Candidate A)
DATABASE_MIGRATIONS=NONE
FORUM_RUNTIME_SETTINGS=UNMODIFIED
PIKAPODS_SFTP=CONTACT_FORBIDDEN
PR_MERGE=FORBIDDEN (Draft status retained)
```
