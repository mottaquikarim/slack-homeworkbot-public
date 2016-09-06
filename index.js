const config = require('./appconfig');
const TrelloAPI = require('./TrelloAPI');
const SlackAPI = require('./SlackAPI');
const Express = require('express');
const Webtask = require('webtask-tools');
const request = require('superagent');
const url = require('url');
const app = Express();

// Middleware
const bodyParser = require('body-parser');
app.use(bodyParser.json());

// Routes
app.post('/start', init);
app.post('/hook', hook);

// expose this express app as a webtask-compatible function
module.exports = Webtask.fromExpress(app);

// Implementation
function init( req, res ) {
    const reqData = req.webtaskContext.data;

    const username = reqData.user_name;
    const userId = reqData.user_id;
    const responseUrl = reqData.response_url;
    const token = reqData.token;
    const teamId = reqData.team_id;
    const text = reqData.text;

    if ( token !== config.slack.token ) return;

    if ( !text ) {

        res.json({
          "text": "",
          "attachments": [{
            "title": "Almost there",
            "pretext": ":pray: Please try again!",
            "text": `I'm going to need your homework URL, ${username}.`,
            "color": "danger"
          }, {
            "title": "Protip",
            "text": 'Please paste the homework URL after the slash command, \nie: /homework http://mottaquikarim.github.io/WEBSITE2',
            "color": "#439FE0",
            "mkdown": true
          }]
        });
        return;

    }

    initTrello({
        username,
        userId,
        responseUrl,
        teamId,
        text,
    });

    res.json({
      "text": ":fire: :fire: :fire:",
      "attachments": [{
        "title": "BRB",
        "text": "Uploading your homework...!",
        "color": "warning"
      }]
    });
} // init

function hook( req, res ) {
    const { action, model } = JSON.parse( req.webtaskContext.data.body );
    const url = model.desc.split('\n').pop().split('COMMITS: ').pop();
    const { type, data } = action;
    const { name } = req.webtaskContext.query;
    const isUpdateCard = type === 'updateCard';
    const isListAfter = data.listAfter && data.listAfter.name === 'Graded';

    if ( isUpdateCard && isListAfter ) {
        const slack = new SlackAPI(
            config.slack.webToken,
            config.slack.apiRoot
        );

        const attachments = [{
            "title": "Click here to view HW feedback!",
            "title_link": url,
            "text": "The commits that have feedback on them will have a small message icon to the right side.",
            "color":"good",
        }];
        const msg = 'Click on the link below to view comments.';
        slack.postMessage(
            name,
            msg,
            JSON.stringify(attachments)
        ).then((data) => {
            //console.log('here!', data );
            res.send({
                status: 410,
                value: 'Gone',
            });
        });
    }
    else {
        res.send({
            status: 200,
            value: 'Ok',
        });
    }

} // hook

function initTrello( data ) {
    const { username, userId, responseUrl, teamId, text } = data;
    const parsedText = parseGitHubLink( text );
    if ( text.indexOf('github.io') === -1 ) {
        request
            .post( responseUrl )
            .set('content-type', 'application/json')
            .send({
                "text": "Hmm, doesn't look like a github.io link..."
            })
            .end(function(err, res) {
                if ( err ) console.log( err );
                console.log('Error: no link present');
            });
        return;
    }

    const trello = new TrelloAPI(
        config.trello.key,
        config.trello.token,
        config.trello.apiRoot
    );

    const slack = new SlackAPI(
        config.slack.webToken,
        config.slack.apiRoot
    );

    let userFullName;

    slack.getUsers().then((data) => {
        userFullName = data.members.filter((user) => {
            return user.name === username;
        })[ 0 ].real_name;
        console.log('FULL username is', userFullName);
        return trello.getLists( config.trello.boardId );
    })
    .then(( data ) => {
        if ( data.length > 0 ) {
            return data.filter(( list ) => {
                return list.name === 'Submissions';
            })[ 0 ];
        }

        return Promise.all([
            trello.postList('Submissions', config.trello.boardId ),
            trello.postList('Grading', config.trello.boardId ),
            trello.postList('Graded', config.trello.boardId ),
        ]).then((lists) => {
            return lists.filter( ( list ) => {
                return list.name === 'Submissions';
            })[ 0 ];
        });
    })
    .then((list) => {
        return trello.postCard(
            userFullName,
            parsedText,
            list.id,
            null
        );
    })
    .then((card) => {
        return trello.webHook(
            userFullName + "'s webhook for hw grade completion",
            'http://homeworkfewd629.webscript.io/?name='+username,
            card.id
        );
    })
    .then(( data ) => {
        console.log( 'webhook', data );
        request
            .post( responseUrl )
            .set('content-type', 'application/json')
            .send({
                "text": "Great, thanks!",
                "attachments": [{
                    "title": "Donezo! :ok_hand:",
                    "text": "Your homework has been submitted.\nYou will receive a message once it has been graded.",
                    "color": "good"
                }]
            })
            .end(function(err, res) {
                if ( err ) console.log( err );
                console.log('Success: Homework submitted for ' + username);
            });
    })
    .catch((err) => {
        console.log(err);
        request
            .post( responseUrl )
            .set('content-type', 'application/json')
            .send({
                "text": ":cry:",
                "attachments": [{
                    "title": "Whoops!",
                    "text": "Something went wrong during submission! Please try again.",
                    "color": "danger"
                }]
            })
            .end(function(err, res) {
                if ( err ) console.log( err );
                console.log('ERROR: Homework submission for ' + username + ' has failed');
            });
    });
} // initTrello

// Utils
function parseGitHubLink( url ) {
    let splitByProtocol = url.split('//');
    if ( splitByProtocol.length > 1 ) {
        splitByProtocol = splitByProtocol.pop();
    }
    else {
        splitByProtocol = splitByProtocol[ 0 ];
    }

    let splitBySlashes = splitByProtocol.split('/');
    const hostName = splitBySlashes.shift();
    const repoName = splitBySlashes.shift();

    const userName = hostName.split('.').shift();

    const returnable = `URL: ${url}
REPO: https://www.github.com/${userName}/${repoName}
COMMITS: https://www.github.com/${userName}/${repoName}/commits/master`;

    return returnable;
} // parseGitHubLink
