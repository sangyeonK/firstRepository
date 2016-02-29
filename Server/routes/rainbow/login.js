var step = require('step');
var logger = require( '../../common/logger.js' );
var mysql = require( '../../common/mysql.js' );
var responsor = require('../../common/responsor.js');
var common = require('../../common/common.js');
var auth = require('../../common/auth.js');

module.exports = function(req, res) {
    
    var connection, result = {};
    var params, session, isAutoLogin;

    //자동 로그인 처리
    if(req.headers['token'] != undefined )
    {
        session = auth.decrypt(req.headers['token']);
        if(session == undefined)
        {
            return responsor( common.error(2) , res );
        }
        
        isAutoLogin = true;
    }
    else
    {
        params = common.checkRequest( req, ['user_id','password'] ); 
        
        if( params.err !== undefined )
            return responsor( params.err, res );
        
        isAutoLogin = false;
    }

    step(
        function () 
        {
            mysql.getConnection( this );
        },
        function (err, conn) 
        {
            if( err ) throw err;
            
            connection = conn;
            
            if( isAutoLogin )
                var query = mysql.makeQuery( 'call spGetUserAccount(%d)', session.user_sn );
            else
                var query = mysql.makeQuery( 'call spLogin(%s,%s)', params.user_id, params.password );
            
            connection.query( query , this );
        },
        function ( err, rows, fields ) 
        {
            if( err ) throw err;

            if( rows[0][0].$userSN == null ) throw common.error(6);
            
            var userNames = [];
            if( rows[0][0].$ownerName != null )
                userNames.push( rows[0][0].$ownerName );
            if( rows[0][0].$partnerName != null)
                userNames.push( rows[0][0].$partnerName );
            
            result.token = auth.encrypt({user_id:rows[0][0].$userID, user_sn:rows[0][0].$userSN, group_sn:rows[0][0].$groupSN});
            result.userId = rows[0][0].$userID;
            result.userName = rows[0][0].$userName;
            result.group = { sn:rows[0][0].$groupSN , member:userNames, inviteCode:rows[0][0].$inviteCode, active:rows[0][0].$active};
            
            return null;
        },
        function ( err )
        {
            if(connection)
                connection.release();
            
            return responsor( err, res, result );
        }
    );
};