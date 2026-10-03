/**
 * Canonical Flarum discussion subscription transitions for the phone star.
 * Persistence remains discussion.save({ subscription }).
 * ignore is not displayed as followed; activating the star follows.
 */

export function nextDiscussionFollowSubscription(current) {
  return current === 'follow' ? null : 'follow';
}

export function discussionFollowStarPresentation(current) {
  const followed = current === 'follow';
  return {
    followed,
    icon: followed ? 'fas fa-star' : 'far fa-star',
    label: followed ? 'Unfollow discussion' : 'Follow discussion',
  };
}

export function canMutateDiscussionFollow(user) {
  return !!user;
}
