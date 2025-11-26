import { MAX_VOTES, MAX_NOMINATIONS_PER_USER, POLLS_CLOSE_DAYS_BEFORE } from '../../lib/config'

export default function HowItWorksPage() {
  return (
    <section className="section">
      <div className="container">
        <div className="content">
          <h1 className="title has-text-centered">How It Works</h1>
          <p className="subtitle has-text-centered">
            A simple workflow for choosing movies together
          </p>

          <div className="box has-background-dark mt-5">
            <div className="columns is-vcentered">
              <div className="column is-narrow">
                <span className="tag is-large is-primary">1</span>
              </div>
              <div className="column">
                <h3 className="title is-4">Create Lists</h3>
                <p>
                  Anyone can create movie lists at any time. Add movies from TMDB (The Movie
                  Database) with all their details like runtime, directors, and cast automatically
                  fetched.
                </p>
              </div>
            </div>
          </div>

          <div className="box has-background-dark">
            <div className="columns is-vcentered">
              <div className="column is-narrow">
                <span className="tag is-large is-warning">2</span>
              </div>
              <div className="column">
                <h3 className="title is-4">Nominate Your Favorites</h3>
                <p>
                  Each person can nominate <strong>{MAX_NOMINATIONS_PER_USER} list</strong> for the
                  next meetup. Go to the <strong>All Lists</strong> page and click the star (☆) to
                  nominate. You can change your nomination anytime before polls close.
                </p>
                <p className="help">
                  Nominating a list removes any previous nomination and clears all votes on the old
                  list.
                </p>
              </div>
            </div>
          </div>

          <div className="box has-background-dark">
            <div className="columns is-vcentered">
              <div className="column is-narrow">
                <span className="tag is-large is-success">3</span>
              </div>
              <div className="column">
                <h3 className="title is-4">Vote on Nominated Lists</h3>
                <p>
                  Once lists are nominated, they appear on the <strong>Nominated</strong> page
                  (home). You have up to <strong>{MAX_VOTES} votes</strong> to distribute among
                  nominated lists.
                </p>
                <p className="help">You can only vote on lists that have been nominated.</p>
              </div>
            </div>
          </div>

          <div className="box has-background-dark">
            <div className="columns is-vcentered">
              <div className="column is-narrow">
                <span className="tag is-large is-info">4</span>
              </div>
              <div className="column">
                <h3 className="title is-4">Polls Close & Selection</h3>
                <p>
                  Polls automatically close{' '}
                  <strong>{POLLS_CLOSE_DAYS_BEFORE} days before the meetup</strong>. The list with
                  the most votes wins. In case of a tie, the list with more all-time votes wins. If
                  still tied, the oldest list wins.
                </p>
              </div>
            </div>
          </div>

          <div className="box has-background-dark">
            <div className="columns is-vcentered">
              <div className="column is-narrow">
                <span className="tag is-large is-link">5</span>
              </div>
              <div className="column">
                <h3 className="title is-4">Watch & Repeat</h3>
                <p>
                  The winning list is displayed at the top of the page. After the meetup, the
                  process starts over for the next one.
                </p>
              </div>
            </div>
          </div>

          <hr />

          <div className="notification is-info is-light">
            <h4 className="title is-5">Sorting & Default Order</h4>
            <p>
              Lists are sorted by <strong>current meetup votes</strong> (descending), then{' '}
              <strong>all-time votes</strong> (descending), then by <strong>creation date</strong>{' '}
              (oldest first). This gives preference to highly voted lists while breaking ties
              fairly.
            </p>
          </div>

          <div className="notification is-warning is-light">
            <h4 className="title is-5">Vote Tracking</h4>
            <p>
              Votes are tracked <strong>per meetup</strong>. The number in parentheses shows
              all-time votes, while the main number shows votes for the specific meetup. This helps
              track popularity over time.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
