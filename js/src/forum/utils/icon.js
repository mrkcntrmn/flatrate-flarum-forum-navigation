import Icon from 'flarum/common/components/Icon';

// Preserve the accepted helper call sites using Flarum 2's supported component.
export default function icon(name, attrs = {}) {
  return m(Icon, { ...attrs, name, className: `icon ${name} ${attrs.className || ''}`.trim() });
}
