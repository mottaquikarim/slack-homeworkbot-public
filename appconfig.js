const testWebToken = /*generate from slack*/;

module.exports = {
    slack: {
        token: /* grab from slack */,
        webToken: testWebToken,
        apiRoot: 'https://slack.com/api/',
    },
    trello: {
        key: /* grab from trello */,
        token: /* generate fro trello */,
        boardId: /* somehow grab boardId, this is usually embedded into the FE somewhere... */,
        apiRoot: 'https://api.trello.com/1/'
    }
};
