{{-- Derived from flarum/core v1.8.19 framework/core/views/frontend/content.blade.php.
     FlatRate changes add data-nosnippet to non-content fallback chrome and
     a temporary sitewide maintenance announcement. Keep #flarum-content
     untouched so server-rendered discussion content remains snippet-eligible. --}}

<div
    id="flatrate-maintenance-banner"
    class="FlatRateMaintenanceBanner"
    role="status"
    aria-label="Maintenance announcement"
    data-nosnippet
    hidden
>
    <div class="container FlatRateMaintenanceBanner-inner">
        <div class="FlatRateMaintenanceBanner-message">
            FLATRATE.WIKI is undergoing maintenance.  — 4:00 PM, 9/24/26
        </div>
        <button
            type="button"
            class="FlatRateMaintenanceBanner-dismiss"
            aria-label="Dismiss maintenance announcement"
            title="Dismiss"
        >&times;</button>
    </div>
</div>

<script>
    (function () {
        var banner = document.getElementById('flatrate-maintenance-banner');
        if (!banner) {
            return;
        }

        var storageKey = 'flatrate:maintenance-banner:2026-09-24-1600';
        var dismissed = false;

        try {
            dismissed = window.localStorage.getItem(storageKey) === 'dismissed';
        } catch (error) {
            dismissed = false;
        }

        if (dismissed) {
            banner.remove();
            return;
        }

        var drawer = document.getElementById('drawer');
        if (drawer && drawer.parentNode) {
            drawer.parentNode.insertBefore(banner, drawer.nextSibling);
        }

        banner.hidden = false;

        var dismissButton = banner.querySelector('.FlatRateMaintenanceBanner-dismiss');
        if (!dismissButton) {
            return;
        }

        dismissButton.addEventListener('click', function () {
            try {
                window.localStorage.setItem(storageKey, 'dismissed');
            } catch (error) {
                // Storage can be unavailable in hardened/private browsing modes.
            }

            banner.remove();
        });
    })();
</script>

<div id="flarum-loading" style="display: none" data-nosnippet>
    {{ $translator->trans('core.views.content.loading_text') }}
</div>

<noscript>
    <div class="Alert" data-nosnippet>
        <div class="container">
            {{ $translator->trans('core.views.content.javascript_disabled_message') }}
        </div>
    </div>
</noscript>

<div id="flarum-loading-error" style="display: none" data-nosnippet>
    <div class="Alert">
        <div class="container">
            {{ $translator->trans('core.views.content.load_error_message') }}
        </div>
    </div>
</div>

<noscript id="flarum-content">
    {!! $content !!}
</noscript>
