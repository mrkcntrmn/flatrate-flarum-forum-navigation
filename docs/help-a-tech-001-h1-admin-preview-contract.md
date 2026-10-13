# HELP-A-TECH-001 — H1 Admin-Preview Contract & Rollout Governance

**Work Order:** `CONTRIBUTION-ENGAGEMENT-001-HELP-A-TECH-H1`  
**Parent Work Order:** `FLATRATE-PRODUCT-ENGAGEMENT-001-R9.1`  
**Repository:** `mrkcntrmn/flatrate-flarum-forum-navigation`  
**Document Class:** `PREVIEW_CONTRACT_AND_ROLLOUT_GOVERNANCE`  
**Status:** `DEFAULT_OFF_SOURCE_ONLY`  
**Date:** October 12, 2026  

---

## 1. Operating Contract

This contract defines the operational controls for the **Help a Tech** admin preview.

### 1.1 Setting Key & Defaults
```text
SETTING_KEY=flatrate-forum-navigation.help_a_tech_admin_preview
DEFAULT_VALUE=0 (false)
NORMALIZATION=fail_closed
SERIALIZER_ATTRIBUTE=flatrateHelpATechAdminPreview
```

### 1.2 Authorization Matrix
| Viewer Identity | Setting = 0 (Default) | Setting = 1 |
|---|:---:|:---:|
| **Guest** | Hidden (`null`) | Hidden (`null`) |
| **Ordinary Member (Group 3)** | Hidden (`null`) | Hidden (`null`) |
| **Beta Tester (Non-Admin)** | Hidden (`null`) | Hidden (`null`) |
| **Administrator (Group 1)** | Hidden (`null`) | **Visible** (if 1–3 eligible items exist) |

---

## 2. Subsequent Phase Gates

| Phase | Description | Activation Condition | Status |
|---|---|---|:---:|
| **H0 — Feasibility** | Source architecture & inventory review | Merged via PR #1273 | `COMPLETE` |
| **H1 — Source Prototype** | Default-OFF prototype, unit/security tests, draft PR | This work order | `COMPLETED` |
| **H2 — Admin Preview Qualification** | Visual/interaction acceptance in staging | Requires separate owner approval | `PENDING` |
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
```
