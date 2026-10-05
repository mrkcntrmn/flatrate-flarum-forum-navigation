{{-- Derived from flarum/core v1.8.19 framework/core/views/frontend/content.blade.php.
     FlatRate changes add data-nosnippet to non-content fallback chrome and
     a settings-driven sitewide maintenance announcement. Keep #flarum-content
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
            <div class="FlatRateMaintenanceBanner-copy"></div>
        </div>
        <button
            type="button"
            class="FlatRateMaintenanceBanner-dismiss"
            aria-label="Dismiss maintenance announcement"
            title="Dismiss"
        >&times;</button>
    </div>
</div>

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
