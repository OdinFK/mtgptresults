'use strict';

import React from 'react';
import {render} from 'react-dom';
import {
  Router,
  Route,
  IndexRoute,
  Link,
  browserHistory
} from 'react-router';
import DocumentTitle from 'react-document-title';

import NotFound from './NotFound.react.js';
import Page from './Page.react.js';
import Players from './Players.js';
import PlayerLink from './PlayerLink.react.js';

var _ = require('underscore');
var accounting = require('accounting');
var Helper = require('./../../lib/helper.js');


var Player = React.createClass({
  render: function() {
    var id = this.props.params.id;
    var p = window.Players[id];
    if (!p) {
      return (<NotFound />);
    }
    return (
      <div className="col-md-offset-3 col-md-6">
        <DocumentTitle title={p.name} />
        <div className="page-header pageHeader">
          <h1>{p.nationality ? p.name + ' (' + p.nationality + ')' : p.name}</h1>
          {p.hof ? <h4>Hall of Fame</h4> : null}
        </div>
        <div className="statsWrapper">
          <div className="alert alert-info" >
            <div className="statsValue">
              {p.stats.t1} / {p.stats.t8} / {p.stats.t16} / {p.stats.total}
            </div>
            <div>
              <Link to="/rankings/t1">Wins</Link>
              {' / '}
              <Link to="/rankings/t8">T8</Link>
              {' / '}
              <Link to="/rankings/t16">T16</Link>
              {' / '}
              <Link to="/rankings/total">Total</Link>
            </div>
          </div>
          <div className="alert alert-info" >
            <div className="statsValue">
              {accounting.formatMoney(p.stats.money, '$', 0)}
            </div>
            <div>
              <Link to="/rankings/money">
                Total Money
              </Link>
            </div>
          </div>
          <div className="alert alert-info" >
            <div className="statsValue">
              {p.stats.points}
            </div>
            <div>
              <Link to="rankings/points">
                Total Pro Points
              </Link>
            </div>
          </div>
        </div>
        <table className="table table-hover table-striped">
          <thead>
            <tr>
              <th>Date</th>
              <th>Tournament</th>
              <th>Finish</th>
              <th>Pro Points</th>
              <th>Prize Money</th>
            </tr>
          </thead>
          <tbody>
            {_.map(p.tournaments, function(t, index) {
              var tdata = window.Tournaments[t.tid];
              if (!tdata) { return null; }
              var c = null;
              if (t.finish === 1) {
                c = 'success';
              } else if (tdata.team && t.finish <= 4) {
                c = 'warning';
              } else if (!tdata.team && t.finish <= 8) {
                c = 'warning';
              }
              return (
                <tr key={index} className={c}>
                  <td>{tdata.date}</td>
                  <td>
                    <Link to={'/tournament/' + t.tid}>
                      {tdata.name}
                    </Link>
                  </td>
                  <td>{t.rank || t.finish}</td>
                  <td>{t.propoints}</td>
                  <td>
                    {t.money ? accounting.formatMoney(t.money, '$', 0) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
});

var Tournament = React.createClass({
  render: function() {
    var id = this.props.params.id;
    var t = window.Tournaments[id];
    if (!t) {
      return (<NotFound />);
    }
    return (
      <div className="col-md-offset-3 col-md-6">
        <DocumentTitle title={t.name} />
        <div className="page-header pageHeader">
          <h1>
            {t.coverage ? (
              <a href={t.coverage}>{t.name}</a>
            ) : t.name}
          </h1>
          <p className="lead tournamentLead">
            {t.formats.join(' / ')}
          </p>
          <p className="lead tournamentLead">
            {t.date}
          </p>
          <p className="lead tournamentLead">
            {t.location}
          </p>
        </div>
        <table className="table standingsTable table-hover">
          <thead>
            <tr>
              <th></th>
              <th>Player</th>
              <th>Pro Points</th>
              <th>Prize Money</th>
            </tr>
          </thead>
          <tbody>
            {_.map(t.standings, function(p, index) {
              var c = null;
              index = Helper.getPlayerIndex(
                index,
                t.team,
                t.team2hg
              );
              var top_limit = t.team ? 4 : 8;
              if (index === 0) {
                c = 'success';
              } else if (index < top_limit) {
                c = 'warning';
              }
              return (
                <tr className={c} key={p.id}>
                  <td>{p.rank || (index + 1)}</td>
                  <td>
                    <PlayerLink player={Players.byID(p.id)} />
                    {' '}
                    {p.report ? (
                      <a href={p.report}>(report)</a>
                    ) : null}
                  </td>
                  <td>{p.propoints}</td>
                  <td>
                    {p.money ? accounting.formatMoney(p.money, '$', 0) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
});

var Rankings = React.createClass({
  render: function() {
    var col = this.props.params.col;
    var sortedPlayers =
      _.chain(window.Players)
        .values()
        .sortBy(function(player) { return player.stats[col]; })
        .reverse()
        .value();

    // Include anyone tied with the 100th rank
    var cutoff = sortedPlayers[99].stats[col];
    var players = _.filter(sortedPlayers, function(p) { return p.stats[col] >= cutoff; });

    var prev = {value: null};
    var sortImage = <img src="/arrowicon.png" />;
    return (
      <div className="col-md-offset-2 col-md-8">
        <DocumentTitle title="Player Rankings" />
        <div className="page-header pageHeader">
          <h1>Player Rankings</h1>
        </div>
        <table className="table table-hover sortable standingsTable">
          <thead>
            <tr>
              <th></th>
              <th>Player</th>
              <th className="sortableHeader">
                <Link to="/rankings/total">
                  Total PTs
                </Link>
                {col === 'total' ? sortImage : null}
              </th>
              <th className="sortableHeader">
                <Link to="/rankings/t1">
                  Wins
                </Link>
                {col === 't1' ? sortImage : null}
              </th>
              <th className="sortableHeader">
                <Link to="/rankings/t8">
                  Top 8s
                </Link>
                {col === 't8' ? sortImage : null}
              </th>
              <th className="sortableHeader">
                <Link to="/rankings/t16">
                  Top 16s
                </Link>
                {col === 't16' ? sortImage : null}
              </th>
              <th className="sortableHeader">
                <Link to="/rankings/points">
                  Pro Points
                </Link>
                {col === 'points' ? sortImage : null}
              </th>
              <th className="sortableHeader">
                <Link to="/rankings/money">
                  Money
                </Link>
                {col === 'money' ? sortImage : null}
              </th>
              <th className="sortableHeader">
                <Link to="/rankings/t8pct">
                  T8/Total
                </Link>
                {col === 't8pct' ? sortImage : null}
              </th>
            </tr>
          </thead>
          <tbody>
            {_.map(players, function(player, index) {
              if (prev.value !== player.stats[col]) {
                prev.value = player.stats[col];
                prev.index = index;
                ++index;
              } else {
                index = null;
              }
              return (
                <tr key={player.id}>
                  <td>{index}</td>
                  <td className={player.hof ? 'player-hof' : null}>
                    <PlayerLink player={Players.byID(player.id)} hideFlag />
                  </td>
                  <td>{player.stats.total}</td>
                  <td>{player.stats.t1}</td>
                  <td>{player.stats.t8}</td>
                  <td>{player.stats.t16}</td>
                  <td>{player.stats.points}</td>
                  <td>
                    {accounting.formatMoney(player.stats.money, '$', 0)}
                  </td>
                  <td>{player.stats.t8pct + '%'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
});

var RecentTournaments = React.createClass({
  render: function() {
    var that = this;
    return (
      <div className="col-md-offset-3 col-md-6">
        <div className="alert alert-info" role="alert">
          {'This site is now open source on '}
          <a className="alert-link" href="https://github.com/czarandy/mtgptresults">GitHub</a>.
        </div>
        <DocumentTitle title="MTG Pro Tour Results" />
        {_.map(window.Recent, function(tournament) {
          var id = tournament.id;
          return (
            <div key={id}>
              <div className="panel panel-default recentTournamentWrapper">
                <div className="panel-heading">
                  <Link to={'/tournament/' + id}>
                    {tournament.name}
                  </Link>
                </div>
                <div className="panel-body recentTournament">
                  <div className="row">
                    <div className="col-sm-5">
                      <div className="image">
                        {that._renderLogo(id, tournament)}
                        <p>
                          {tournament.formats.join(' / ')}
                          <br />
                          {tournament.date}
                          <br />
                          {tournament.location}
                        </p>
                      </div>
                    </div>
                    <div className="col-sm-7">
                      <ul className="List">
                        {
                          _.map(tournament.top, function(player, idx) {
                            idx = Helper.getPlayerIndex(
                              idx,
                              tournament.team,
                              tournament.team2hg
                            );
                            return (
                              <li className={idx === 0 ? 'List-item List-item--big' : 'List-item '} key={player.id}>
                                <span className="List-index">{idx + 1}{'. '}</span>
                                <PlayerLink player={Players.byID(player.id)} />
                              </li>
                            );
                          })
                        }
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  },
  _renderLogo: function(id, t) {
    if (!t.logo) {
      return null;
    }
    return (
      <Link to={'/tournament/' + id}>
        <img src={'/logo/' + t.logo} />
      </Link>
    );
  }
});

render((
  <Router history={browserHistory}>
    <Route path="/" component={Page}>
      <IndexRoute component={RecentTournaments} />
      <Route path="/player/:id" component={Player} />
      <Route path="/tournament/:id" component={Tournament} />
      <Route path="/rankings/:col" component ={Rankings} />
      <Route path="*" component={NotFound} />
    </Route>
  </Router>
), document.getElementById('approot'));
