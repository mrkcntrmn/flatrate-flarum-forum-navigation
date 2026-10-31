import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import TextEditor from 'flarum/common/components/TextEditor';
import extractText from 'flarum/common/utils/extractText';

export default function registerComposerAccessibility() {
  // Phone styles hide the visible submit text, so retain the native action name.
  extend(TextEditor.prototype, 'controlItems', function (items) {
    const submit = items.get('submit');
    if (submit?.attrs && !submit.attrs['aria-label']) {
      submit.attrs['aria-label'] = extractText(this.attrs.submitLabel);
    }
  });

  // BasicEditorDriver creates its textarea outside Mithril's vnode tree.
  extend(TextEditor.prototype, 'onbuild', function () {
    const input = this.attrs.composer?.editor?.el;
    if (input?.tagName === 'TEXTAREA' && !input.hasAttribute('aria-label')) {
      const label = extractText(this.attrs.placeholder) || extractText(app.translator.trans('flatrate-forum-navigation.forum.composer.content_label'));
      input.setAttribute('aria-label', label);
    }
  });
}
