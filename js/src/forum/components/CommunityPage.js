import Page from 'flarum/common/components/Page';
import LinkButton from 'flarum/common/components/LinkButton';
import IndexPage from 'flarum/forum/components/IndexPage';
import listItems from 'flarum/common/helpers/listItems';
import app from 'flarum/forum/app';

import { getNavigationManifest, isGeneralLiveAvailable, startHereHref } from '../utils/manifest';

/**
 * FlatRate Community landing page.
 * GENERAL_LIVE_AVAILABLE=false → non-interactive coming-soon (no dead link).
 */
export default class CommunityPage extends Page {
  oninit(vnode) {
    super.oninit(vnode);
    this.bodyClass = 'App--index';
  }

  view() {
    const manifest = getNavigationManifest() || {
      community: {
        route: '/community',
        generalLiveAvailable: false,
        startHere: { boardKey: 'start-here', slug: 'start-here' },
      },
    };
    const liveAvailable = isGeneralLiveAvailable();
    const startHref = startHereHref(manifest);

    return (
      <div className="IndexPage FlatRateCommunityPage">
        <div className="container">
          <div className="sideNavContainer">
            <nav className="IndexPage-nav sideNav">
              <ul>{listItems(IndexPage.prototype.sidebarItems().toArray())}</ul>
            </nav>
            <div className="IndexPage-results sideNavOffset">
              <div className="FlatRateCommunityPage-hero">
                <h2 className="FlatRateCommunityPage-title">Community</h2>
                <p className="FlatRateCommunityPage-lede">
                  Start Here for orientation. General Live chat arrives with the dedicated chat rollout.
                </p>
              </div>

              <section className="FlatRateCommunityPage-section" aria-labelledby="flatrate-start-here-heading">
                <h3 id="flatrate-start-here-heading">Start Here</h3>
                <p>New to FlatRate.wiki? Begin with the Start Here board.</p>
                <LinkButton className="Button Button--primary" href={startHref}>
                  Open Start Here
                </LinkButton>
              </section>

              <section className="FlatRateCommunityPage-section" aria-labelledby="flatrate-general-live-heading">
                <h3 id="flatrate-general-live-heading">General Live</h3>
                {liveAvailable ? (
                  <p>
                    <LinkButton className="Button" href={app.forum.attribute('flatrateGeneralLiveRoute') || '#'}>
                      Open General Live
                    </LinkButton>
                  </p>
                ) : (
                  <p className="FlatRateCommunityPage-comingSoon" aria-disabled="true">
                    <span className="FlatRateCommunityPage-comingSoonBadge">Coming soon</span>
                    General Live is unavailable until the chat rollout. This control is intentionally
                    non-interactive.
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
