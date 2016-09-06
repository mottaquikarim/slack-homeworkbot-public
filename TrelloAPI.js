var request = require('superagent');
var request2 = require('request');

function Trello( key, token, api_root ) {
    this.key = key;
    this.token = token;
    this.apiRoot = api_root;
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

Trello.prototype.getLists = function getLists( boardId ) {
    return new Promise(function(resolve, reject) {
        request.get(this.apiRoot+'boards/'+boardId+'/lists')
            .query({ key: this.key })
            .query({ token: this.token })
            .end( _cb( resolve, reject ) );
    }.bind(this));
}

Trello.prototype.postList = function postList( name, idBoard ) {

    return new Promise(function(resolve, reject) {
        request.post(this.apiRoot+'lists')
            .type('form')
            .send({
                name: name,
                idBoard: idBoard,
                key: this.key,
                token: this.token 
            })
            .end( _cb( resolve, reject ) );
    }.bind(this));

}

Trello.prototype.postCard = function postCard( name, desc, idList, due ) {

    return new Promise(function(resolve, reject) {

        request.post(this.apiRoot+'cards')
            .type('form')
            .send({
                key: this.key,
                token: this.token,
                name: name,
                desc: desc,
                due: null,
                idList: idList
            })
            .end( _cb( resolve, reject ) );

    }.bind(this));

}

Trello.prototype.webHook = function webHook( desc, cbUrl, idModel ) {
    return new Promise(function(resolve, reject) {
       var requestObj = {
            url: "https://api.trello.com/1/tokens/" +
                    this.token + 
                    "/webhooks/?key=" +
                    this.key,
            method: 'POST',
            form: {
                description: desc,
                idModel: idModel,
                callbackURL: cbUrl,
            }
        };

        request2( requestObj, function(err, http, resp) {
                if ( err ) {
                    reject( err );
                }

                resolve( resp );
        });
    }.bind(this));
}

module.exports = Trello;
