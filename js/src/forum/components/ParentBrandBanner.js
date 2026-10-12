import Component from 'flarum/common/Component';

import BrandFamilyLinks from './BrandFamilyLinks';
import { listDirectBrandChildren } from '../utils/brandNode';

/**
 * Phone parent-board banner. Tagline, child links, and extra content stay
 * visible without a disclosure control.
 */
export default class ParentBrandBanner extends Component {
  view() {
    const board = this.attrs.board;
    const children = listDirectBrandChildren(board);
    if (!children.length) return null;

    const tagline = this.attrs.tagline || '';
    const extra = this.attrs.extra || null;

    return (
      <div className="FlatRateParentBrandBanner FlatRateParentBrandBanner--static">
        <div className="FlatRateParentBrandBanner-summary">
          {tagline ? (
            <p className="FlatRateBrandTagline Hero-subtitle">{tagline}</p>
          ) : null}
          <div className="FlatRateParentBrandBanner-row">
            <BrandFamilyLinks board={board} />
          </div>
        </div>
        {extra ? (
          <div className="FlatRateParentBrandBanner-extra">{extra}</div>
        ) : null}
      </div>
    );
  }
}
