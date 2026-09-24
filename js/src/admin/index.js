import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import MainLandingPinnedDiscussions from './components/MainLandingPinnedDiscussions';

app.initializers.add('flatrate-forum-navigation-admin', () => {
  app.extensionData
    .for('flatrate-forum-navigation')
    .registerPage(class ForumNavigationAdminPage extends ExtensionPage {
      content() {
        return (
          <div className="FlatRateForumNavigationAdmin container">
            <div className="Form-group">
              <h2>MAIN Landing</h2>
              <p className="helpText">
                Curate Public and Member MAIN pinned discussions. These lists are
                independent of native Flarum Sticky and do not mutate is_sticky.
              </p>
              <MainLandingPinnedDiscussions />
            </div>
          </div>
        );
      }
    });
});
