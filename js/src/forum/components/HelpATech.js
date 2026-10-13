import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import { discussionCanonicalHref } from '../utils/helpATechNavigation.js';

export default class HelpATech extends Component {
  oninit(vnode) {
    super.oninit(vnode);
  }

  view() {
    const items = this.attrs.items;
    if (!Array.isArray(items) || items.length === 0) {
      return null;
    }

    const context = this.attrs.context;
    const contextLabel = context?.label || '';

    return (
      <div
        className="HelpATech HelpATech--adminPreview"
        role="region"
        aria-label="Help a Tech discussion suggestions"
      >
        <div className="HelpATech-header">
          <h3 className="HelpATech-heading">HELP A TECH</h3>
          <p className="HelpATech-subheading">A few discussions where your experience might help.</p>
        </div>
        <ul className="HelpATech-list">
          {items.map((discussion) => {
            const id = typeof discussion.id === 'function' ? discussion.id() : discussion.id;
            const title = typeof discussion.title === 'function' ? discussion.title() : discussion.title;
            const href = discussionCanonicalHref(discussion);

            return (
              <li className="HelpATech-item" key={id}>
                <Link className="HelpATech-link" href={href}>
                  <span className="HelpATech-bullet" aria-hidden="true">›</span>
                  <span className="HelpATech-title">{title}</span>
                  {contextLabel ? (
                    <span className="HelpATech-contextBadge">{contextLabel}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}
