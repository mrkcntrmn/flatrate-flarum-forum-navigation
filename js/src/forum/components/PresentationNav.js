import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import classList from 'flarum/common/utils/classList';
import app from 'flarum/forum/app';

import { brandHref, technicianTopicsHref } from '../utils/manifest';

export default class PresentationNav extends Component {
  oninit(vnode) {
    super.oninit(vnode);
    this.brandsExpanded = true;
    this.expandedParents = {
      gm: false,
      cdjr: false,
    };
  }

  view() {
    const { manifest } = this.attrs;
    const groups = manifest.groups || [];

    return (
      <div className="FlatRatePresentationNav" role="navigation" aria-label="Forum presentation navigation">
        <ul className="FlatRatePresentationNav-list">
          {groups.map((group) => this.renderGroup(group))}
        </ul>
      </div>
    );
  }

  renderGroup(group) {
    if (group.mode === 'link' && group.id === 'community') {
      return (
        <li className="FlatRatePresentationNav-item FlatRatePresentationNav-item--community" key={group.id}>
          <Link className="FlatRatePresentationNav-link" href={app.route('community')}>
            {group.label}
          </Link>
        </li>
      );
    }

    if (group.mode === 'link' && group.id === 'technician-topics') {
      return (
        <li className="FlatRatePresentationNav-item FlatRatePresentationNav-item--technician" key={group.id}>
          <Link className="FlatRatePresentationNav-link" href={technicianTopicsHref(this.attrs.manifest)}>
            {group.label}
          </Link>
        </li>
      );
    }

    if (group.mode === 'tree' && group.id === 'brands') {
      const expanded = this.brandsExpanded;
      const panelId = 'flatrate-brands-tree';
      return (
        <li className="FlatRatePresentationNav-item FlatRatePresentationNav-item--brands" key={group.id}>
          <div className="FlatRatePresentationNav-row">
            <button
              type="button"
              className="FlatRatePresentationNav-expander Button Button--link"
              aria-expanded={expanded ? 'true' : 'false'}
              aria-controls={panelId}
              onclick={() => {
                this.brandsExpanded = !this.brandsExpanded;
              }}
            >
              <span className="FlatRatePresentationNav-expanderIcon" aria-hidden="true">
                {expanded ? '▾' : '▸'}
              </span>
              <span className="Button-label">{group.label}</span>
            </button>
          </div>
          <ul
            id={panelId}
            className={classList('FlatRatePresentationNav-tree', { 'is-collapsed': !expanded })}
            hidden={!expanded}
          >
            {(group.boards || []).map((board) => this.renderBrandNode(board, 0))}
          </ul>
        </li>
      );
    }

    return null;
  }

  renderBrandNode(board, depth) {
    const hasChildren = Array.isArray(board.children) && board.children.length > 0;
    const parentKey = board.boardKey;
    const expanded = hasChildren ? Boolean(this.expandedParents[parentKey]) : false;
    const panelId = hasChildren ? `flatrate-brand-children-${parentKey}` : null;

    return (
      <li
        className={classList('FlatRatePresentationNav-brand', `depth-${depth}`, {
          'has-children': hasChildren,
          'is-expanded': expanded,
        })}
        key={board.boardKey}
      >
        <div className="FlatRatePresentationNav-row">
          {hasChildren ? (
            <button
              type="button"
              className="FlatRatePresentationNav-expander Button Button--link"
              aria-expanded={expanded ? 'true' : 'false'}
              aria-controls={panelId}
              aria-label={`${expanded ? 'Collapse' : 'Expand'} ${board.name}`}
              onclick={() => {
                this.expandedParents[parentKey] = !this.expandedParents[parentKey];
              }}
            >
              <span className="FlatRatePresentationNav-expanderIcon" aria-hidden="true">
                {expanded ? '▾' : '▸'}
              </span>
            </button>
          ) : (
            <span className="FlatRatePresentationNav-expanderSpacer" aria-hidden="true" />
          )}
          <Link className="FlatRatePresentationNav-link FlatRatePresentationNav-brandLink" href={brandHref(board)}>
            {board.name}
          </Link>
        </div>
        {hasChildren ? (
          <ul id={panelId} className="FlatRatePresentationNav-children" hidden={!expanded}>
            {board.children.map((child) => this.renderBrandNode(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    );
  }
}
