import app from 'flarum/admin/app';
import Component from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Stream from 'flarum/common/utils/Stream';

import { normalizePinnedIds } from '../../forum/utils/mainLandingPins';

const SETTING_PUBLIC = 'flatrate-forum-navigation.public_main_pinned_discussion_ids';
const SETTING_MEMBER = 'flatrate-forum-navigation.member_main_pinned_discussion_ids';

function parseDiscussionRef(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;

  if (/^\d+$/.test(text)) {
    return Number(text);
  }

  const fromPath = text.match(/\/d\/(\d+)/);
  if (fromPath) {
    return Number(fromPath[1]);
  }

  return null;
}

export default class MainLandingPinnedDiscussions extends Component {
  oninit(vnode) {
    super.oninit(vnode);
    this.query = Stream('');
    this.results = [];
    this.loadingSearch = false;
    this.publicIds = Stream(JSON.stringify(this.loadIds(SETTING_PUBLIC)));
    this.memberIds = Stream(JSON.stringify(this.loadIds(SETTING_MEMBER)));
    this.meta = {};
    this.saving = false;
    this.status = '';
    this.hydrateMeta([...this.readIds('public'), ...this.readIds('member')]);
  }

  view() {
    return (
      <div className="FlatRateMainLandingAdmin">
        <div className="Form-group">
          <label>Search discussions</label>
          <div className="FlatRateMainLandingAdmin-search">
            <input
              className="FormControl"
              bidi={this.query}
              placeholder="Search title, or paste discussion URL / ID"
              onkeydown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  this.search();
                }
              }}
            />
            <Button className="Button" onclick={() => this.search()} loading={this.loadingSearch}>
              Search
            </Button>
          </div>
          {this.results.length ? (
            <ul className="FlatRateMainLandingAdmin-results">
              {this.results.map((discussion) => this.resultRow(discussion))}
            </ul>
          ) : null}
        </div>

        <div className="FlatRateMainLandingAdmin-columns">
          {this.listSection('PUBLIC MAIN', 'public', this.readIds('public'))}
          {this.listSection('MEMBER MAIN', 'member', this.readIds('member'))}
        </div>

        <div className="Form-group">
          <Button className="Button Button--primary" loading={this.saving} onclick={() => this.save()}>
            Save MAIN pins
          </Button>
          {this.status ? <p className="helpText">{this.status}</p> : null}
        </div>
      </div>
    );
  }

  listSection(title, audience, ids) {
    return (
      <div className="FlatRateMainLandingAdmin-section" data-audience={audience}>
        <h3>{title}</h3>
        {!ids.length ? <p className="helpText">No discussions configured.</p> : null}
        <ol className="FlatRateMainLandingAdmin-list">
          {ids.map((id, index) => {
            const meta = this.meta[id] || {};
            const stale = meta.missing === true;
            const guestWarning = audience === 'public' && meta.guestVisible === false;

            return (
              <li key={`${audience}-${id}`} className={stale ? 'is-stale' : ''}>
                <div className="FlatRateMainLandingAdmin-row">
                  <span className="FlatRateMainLandingAdmin-index">{index + 1}.</span>
                  <div className="FlatRateMainLandingAdmin-body">
                    <strong>{meta.title || `Discussion #${id}`}</strong>
                    <div className="helpText">ID {id}{stale ? ' — missing or deleted' : ''}</div>
                    {guestWarning ? (
                      <div className="FlatRateMainLandingAdmin-warning">
                        May not be visible to guests (informational; server enforces visibility).
                      </div>
                    ) : null}
                  </div>
                  <div className="FlatRateMainLandingAdmin-actions">
                    <Button
                      className="Button Button--link"
                      disabled={index === 0}
                      onclick={() => this.move(audience, index, -1)}
                      aria-label="Move up"
                    >
                      ↑
                    </Button>
                    <Button
                      className="Button Button--link"
                      disabled={index >= ids.length - 1}
                      onclick={() => this.move(audience, index, 1)}
                      aria-label="Move down"
                    >
                      ↓
                    </Button>
                    <Button
                      className="Button Button--link"
                      onclick={() => this.remove(audience, id)}
                      aria-label={`Remove discussion ${id}`}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  resultRow(discussion) {
    const id = Number(discussion.id());
    const title = discussion.title();

    return (
      <li key={id}>
        <span>
          #{id} {title}
        </span>
        <Button className="Button Button--link" onclick={() => this.add('public', id, discussion)}>
          Add to Public MAIN
        </Button>
        <Button className="Button Button--link" onclick={() => this.add('member', id, discussion)}>
          Add to Member MAIN
        </Button>
      </li>
    );
  }

  loadIds(settingKey) {
    const raw = app.data.settings[settingKey];
    return normalizePinnedIds(raw || '[]');
  }

  readIds(audience) {
    const stream = audience === 'public' ? this.publicIds : this.memberIds;
    return normalizePinnedIds(stream());
  }

  writeIds(audience, ids) {
    const stream = audience === 'public' ? this.publicIds : this.memberIds;
    stream(JSON.stringify(normalizePinnedIds(ids)));
  }

  add(audience, id, discussion = null) {
    const ids = this.readIds(audience);
    if (!ids.includes(id)) {
      ids.push(id);
      this.writeIds(audience, ids);
    }
    if (discussion) {
      this.meta[id] = {
        title: discussion.title(),
        missing: false,
        guestVisible: discussion.attribute('isHidden') !== true,
      };
    }
  }

  remove(audience, id) {
    this.writeIds(
      audience,
      this.readIds(audience).filter((entry) => entry !== id)
    );
  }

  move(audience, index, delta) {
    const ids = this.readIds(audience);
    const next = index + delta;
    if (next < 0 || next >= ids.length) return;
    const copy = ids.slice();
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    this.writeIds(audience, copy);
  }

  search() {
    const raw = this.query();
    const directId = parseDiscussionRef(raw);

    if (directId) {
      this.loadingSearch = true;
      app.store
        .find('discussions', String(directId))
        .then((discussion) => {
          this.results = discussion ? [discussion] : [];
          this.loadingSearch = false;
          m.redraw();
        })
        .catch(() => {
          this.results = [];
          this.loadingSearch = false;
          this.status = `Could not load discussion #${directId}`;
          m.redraw();
        });
      return;
    }

    if (!String(raw || '').trim()) {
      this.results = [];
      return;
    }

    this.loadingSearch = true;
    app.store
      .find('discussions', { filter: { q: String(raw).trim() }, page: { limit: 10 } })
      .then((results) => {
        this.results = Array.isArray(results) ? results : [];
        this.loadingSearch = false;
        m.redraw();
      })
      .catch(() => {
        this.results = [];
        this.loadingSearch = false;
        m.redraw();
      });
  }

  hydrateMeta(ids) {
    const unique = normalizePinnedIds(ids);
    unique.forEach((id) => {
      app.store
        .find('discussions', String(id))
        .then((discussion) => {
          this.meta[id] = {
            title: discussion.title(),
            missing: false,
            guestVisible: true,
          };
          m.redraw();
        })
        .catch(() => {
          this.meta[id] = { title: null, missing: true, guestVisible: false };
          m.redraw();
        });
    });
  }

  save() {
    this.saving = true;
    this.status = '';

    const publicIds = this.readIds('public');
    const memberIds = this.readIds('member');

    Promise.all([
      app.request({
        method: 'POST',
        url: app.forum.attribute('apiUrl') + '/settings',
        body: { [SETTING_PUBLIC]: JSON.stringify(publicIds) },
      }),
      app.request({
        method: 'POST',
        url: app.forum.attribute('apiUrl') + '/settings',
        body: { [SETTING_MEMBER]: JSON.stringify(memberIds) },
      }),
    ])
      .then(() => {
        app.data.settings[SETTING_PUBLIC] = JSON.stringify(publicIds);
        app.data.settings[SETTING_MEMBER] = JSON.stringify(memberIds);
        this.saving = false;
        this.status = 'Saved.';
        m.redraw();
      })
      .catch(() => {
        this.saving = false;
        this.status = 'Save failed.';
        m.redraw();
      });
  }
}
