import Component from 'flarum/common/Component';
import icon from 'flarum/common/helpers/icon';

import BrandFamilyLinks from './BrandFamilyLinks';
import { listDirectBrandChildren } from '../utils/brandNode';

/**
 * Phone parent-board banner. Tagline and child links stay visible.
 * The chevron toggles only the extra slot. Child links are not the toggle.
 */
export default class ParentBrandBanner extends Component {
  oninit(vnode) {
    super.oninit(vnode);
    this.expanded = false;
    const slug = this.attrs.board && this.attrs.board.slug ? this.attrs.board.slug : 'brand';
    this.controlsId = `flatrate-parent-banner-${slug}`;
  }

  view() {
    const board = this.attrs.board;
    const children = listDirectBrandChildren(board);
    if (!children.length) return null;

    const tagline = this.attrs.tagline || '';

    return (
      <div className={`FlatRateParentBrandBanner ${this.expanded ? 'FlatRateParentBrandBanner--expanded' : 'FlatRateParentBrandBanner--collapsed'}`}>
        <div className="FlatRateParentBrandBanner-summary">
          {tagline ? (
            <p className="FlatRateBrandTagline Hero-subtitle">{tagline}</p>
          ) : null}
          <div className="FlatRateParentBrandBanner-row">
            <BrandFamilyLinks board={board} />
            <button
              type="button"
              className="Button Button--icon FlatRateParentBrandBanner-toggle"
              aria-expanded={this.expanded ? 'true' : 'false'}
              aria-controls={this.controlsId}
              aria-label={this.expanded ? 'Collapse brand details' : 'Expand brand details'}
              onclick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                this.expanded = !this.expanded;
              }}
            >
              {icon(this.expanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down')}
            </button>
          </div>
        </div>
        <div className="FlatRateParentBrandBanner-extra" id={this.controlsId} hidden={!this.expanded}>
          {this.attrs.extra || null}
        </div>
      </div>
    );
  }
}
