import Component from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';

export const DISCUSSION_JUMP_TO_TOP_THRESHOLD = 480;

export default class DiscussionJumpToTop extends Component {
  oninit(vnode) {
    super.oninit(vnode);

    this.visible = false;
    this.scrollFrame = null;
    this.handleScroll = () => {
      if (this.scrollFrame !== null) return;

      this.scrollFrame = window.requestAnimationFrame(() => {
        this.scrollFrame = null;
        const nextVisible = window.scrollY > DISCUSSION_JUMP_TO_TOP_THRESHOLD;

        if (nextVisible !== this.visible) {
          this.visible = nextVisible;
          m.redraw();
        }
      });
    };
  }

  oncreate() {
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    this.handleScroll();
  }

  onremove() {
    window.removeEventListener('scroll', this.handleScroll);

    if (this.scrollFrame !== null) {
      window.cancelAnimationFrame(this.scrollFrame);
      this.scrollFrame = null;
    }
  }

  jumpToTop() {
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  view() {
    return (
      <Button
        className={`Button Button--icon FlatRateDiscussionJumpToTop ${this.visible ? 'is-visible' : ''}`}
        icon="fas fa-chevron-up"
        aria-label="Jump to top"
        aria-hidden={this.visible ? 'false' : 'true'}
        tabindex={this.visible ? 0 : -1}
        onclick={() => this.jumpToTop()}
      />
    );
  }
}
