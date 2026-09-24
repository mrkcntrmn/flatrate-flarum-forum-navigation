import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';

import { brandHref } from '../utils/manifest';
import { listDirectBrandChildren } from '../utils/brandNode';

/**
 * Parent/umbrella Brand hero child links. Manifest-driven — never hardcode
 * GM/CDJR/JLR names.
 */
export default class BrandFamilyLinks extends Component {
  view() {
    const board = this.attrs.board;
    const children = listDirectBrandChildren(board);

    if (!children.length) {
      return null;
    }

    return (
      <nav className="FlatRateBrandFamilyLinks" aria-label={`${board.name} family boards`}>
        <ul className="FlatRateBrandFamilyLinks-list">
          {children.map((child, index) => (
            <li className="FlatRateBrandFamilyLinks-item" key={child.boardKey || child.slug}>
              {index > 0 ? <span className="FlatRateBrandFamilyLinks-sep" aria-hidden="true">·</span> : null}
              <Link className="FlatRateBrandFamilyLinks-link" href={brandHref(child)}>
                {child.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    );
  }
}
