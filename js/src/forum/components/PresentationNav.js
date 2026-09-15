import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import classList from 'flarum/common/utils/classList';
import icon from 'flarum/common/helpers/icon';

import { brandHref, groupLinkHref } from '../utils/manifest';
import {
  START_NAV_ICON,
  START_NAV_LABEL,
  TECHNICIAN_TOPICS_ICON,
  BRAND_NAV_ICON,
  isStartNavGroup,
  isTechnicianTopicsGroup,
} from '../utils/startNav';

const FOLLOWED_BRAND_KEYS_ATTRIBUTE = 'flatrateFollowedBrandKeys';

function normalizeFollowedBrandKeys(raw) {
  if (Array.isArray(raw)) {
    return raw.map((key) => String(key));
  }

  if (typeof raw !== 'string' || raw.trim() === '') {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((key) => String(key));
    }
  } catch (_error) {
    // Allow a simple comma-separated fallback while the projection contract settles.
  }

  return raw
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
}

function followedBrandKeys() {
  const raw = app.forum && typeof app.forum.attribute === 'function'
    ? app.forum.attribute(FOLLOWED_BRAND_KEYS_ATTRIBUTE)
    : null;

  return new Set(normalizeFollowedBrandKeys(raw));
}

export default class PresentationNav extends Component {
  view() {
    const { manifest } = this.attrs;
    const groups = manifest.groups || [];
    this.followedBrandKeys = followedBrandKeys();

    return (
      <div className="FlatRatePresentationNav" role="navigation" aria-label="Forum presentation navigation">
        <ul className="FlatRatePresentationNav-list">
          {groups.map((group) => this.renderGroup(group))}
        </ul>
      </div>
    );
  }

  renderGroup(group) {
    if (group.mode === 'link') {
      const start = isStartNavGroup(group);
      const technician = isTechnicianTopicsGroup(group);
      const linkIcon = start ? START_NAV_ICON : technician ? TECHNICIAN_TOPICS_ICON : null;
      return (
        <li
          className={`FlatRatePresentationNav-item FlatRatePresentationNav-item--link FlatRatePresentationNav-item--${group.id}`}
          key={group.id}
        >
          <Link
            className={classList('FlatRatePresentationNav-link', {
              'FlatRatePresentationNav-link--start': start,
              'FlatRatePresentationNav-link--technician': technician,
              hasIcon: Boolean(linkIcon),
            })}
            href={groupLinkHref(group, this.attrs.manifest)}
          >
            {linkIcon ? icon(linkIcon) : null}
            {start ? START_NAV_LABEL : group.label}
          </Link>
        </li>
      );
    }

    if (group.mode === 'tree' && group.id === 'brands') {
      return (
        <li className="FlatRatePresentationNav-item FlatRatePresentationNav-item--brands" key={group.id}>
          <ul className="FlatRatePresentationNav-tree">
            {(group.boards || []).map((board) => this.renderBrandNode(board, 0))}
          </ul>
        </li>
      );
    }

    return null;
  }

  renderBrandNode(board, depth) {
    const children = Array.isArray(board.children) ? board.children : [];
    const hasChildren = children.length > 0;
    const isFollowed = this.followedBrandKeys && this.followedBrandKeys.has(String(board.boardKey));

    return (
      <li
        className={classList('FlatRatePresentationNav-brand', `depth-${depth}`, {
          'has-children': hasChildren,
          'is-followed': isFollowed,
        })}
        key={board.boardKey}
      >
        <div className="FlatRatePresentationNav-row">
          <Link
            className={classList('FlatRatePresentationNav-link', 'FlatRatePresentationNav-brandLink', 'hasIcon')}
            href={brandHref(board)}
          >
            {icon(BRAND_NAV_ICON)}
            {board.name}
          </Link>
          {isFollowed ? (
            <span
              className="FlatRatePresentationNav-followingStar"
              role="img"
              aria-label={`Following ${board.name}`}
              title={`Following ${board.name}`}
            >
              {icon('fas fa-star')}
            </span>
          ) : null}
        </div>
        {hasChildren ? (
          <ul className="FlatRatePresentationNav-children">
            {children.map((child) => this.renderBrandNode(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    );
  }
}
