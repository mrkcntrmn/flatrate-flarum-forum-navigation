import Page from 'flarum/common/components/Page';
import LinkButton from 'flarum/common/components/LinkButton';
import IndexPage from 'flarum/forum/components/IndexPage';
import listItems from 'flarum/common/helpers/listItems';
import app from 'flarum/forum/app';

import { getNavigationManifest, startHereHref } from '../utils/manifest';
import { resolveGeneralLiveHref } from '../utils/generalLiveRoute';

/**
 * FlatRate Community landing page.
 * General Live uses the embedded canonical manifest route, never `#`.
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
    const startHref = startHereHref(manifest);
    const liveHref = resolveGeneralLiveHref({
      runtimeRoute: app.forum.attribute('flatrateGeneralLiveRoute'),
      manifest,
    });

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
                  Start Here for orientation, or jump into General Live.
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
                {liveHref ? (
                  <p>
                    <LinkButton className="Button" href={liveHref}>
                      Open General Live
                    </LinkButton>
                  </p>
                ) : (
                  <p className="FlatRateCommunityPage-unavailable" aria-disabled="true">
                    General Live is unavailable because its route metadata is missing.
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
