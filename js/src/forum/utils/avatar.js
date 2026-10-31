import Avatar from 'flarum/common/components/Avatar';

export default function avatar(user, attrs = {}) {
  return m(Avatar, { ...attrs, user });
}
