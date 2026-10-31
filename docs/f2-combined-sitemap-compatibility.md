# Combined Flarum 2 sitemap compatibility

`FORUM-F2-FULL-MEMBER-EXPERIENCE-QUAL-001` found that Navigation and
FoF Sitemap 3 both registered `GET /robots.txt`. The combined application
could not construct its route collection.

Navigation now registers its robots fallback only when `fof-sitemap` is
disabled. Community redirects and canonical handling remain registered.

The disposable full-stack acceptance application uses Flarum 2.0.2,
FoF SEO 4.0.0-beta.16 and FoF Sitemap 3.0.0. Its real HTTP crawl checks verify
one canonical per board/discussion, a generated sitemap containing public
discussions, exclusion of private discussions and profiles, and the
documented `/community` redirect to `/t/start-here`.

The OAuth member-experience harness also disables Sitemap temporarily in
its disposable database and checks the exact Navigation fallback response,
then re-enables Sitemap. This never changes a hosted forum.

Coordination: Navigation PR #101 retains ownership of its presentation
files. This change is limited to `extend.php` and this evidence explanation;
the qualification harness and combined-stack ledger live in the OAuth
restoration branch. No production configuration, deployment or merge is
included.
