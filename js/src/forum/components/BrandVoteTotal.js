import Component from 'flarum/common/Component';
import classList from 'flarum/common/utils/classList';

import { brandVoteTotal, isBrandFollowed } from '../utils/brandVoteTotals';

export default class BrandVoteTotal extends Component {
  view() {
    const { board } = this.attrs;
    const total = brandVoteTotal(board);

    if (total === null) {
      return null;
    }

    const followed = isBrandFollowed(board);
    const label = `${board.name} board total: ${total} upvote${total === 1 ? '' : 's'}`;

    return (
      <span
        className={classList('FlatRateBrandVoteTotal', {
          'is-followed': followed,
        })}
        aria-label={label}
        title={label}
        data-brand-slug={board.slug}
      >
        {total}
      </span>
    );
  }
}
