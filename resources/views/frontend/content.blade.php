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
