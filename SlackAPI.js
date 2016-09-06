var request = require('superagent');

function Slack( webToken, apiRoot ) {
    this.token = webToken;
    this.apiRoot = apiRoot;
}

function _cb( resolve, reject ) {
    return function( err, res ) {
        if ( err ) {
            reject( err );
        }
        else {
            resolve( res.body );
        }
    };
}

Slack.prototype.getUsers = function getUsers() {
    return new Promise(function(resolve, reject) {
        request.post(this.apiRoot+'users.list')
            .send('token='+this.token)
            .end( _cb( resolve, reject ) );
    }.bind(this));
}

Slack.prototype.postMessage = function postMessage( user, message, attachments ) {
    return new Promise(function(resolve, reject) {
        request.post(this.apiRoot+'chat.postMessage')
            .send('token='+this.token)
            .send('as_user='+false)
            .send('channel=@'+user)
            .send('text='+message)
            .send('attachments='+attachments)
            .send('username=HomeworkBot')
            .end( _cb( resolve, reject ) );
    }.bind(this));
}

module.exports = Slack;
