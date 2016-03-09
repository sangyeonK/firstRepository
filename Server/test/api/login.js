var port = require('../../server').port,
    superagent = require('superagent'),
    expect = require('expect.js'),
    common = require('../../common/common.js'),
    mysql = require('../../common/mysql.js'),
    user = require('../helper/user.js');
    
describe('LOGIN API TEST', function() {
    var join_url = 'http://localhost:'+port+'/rainbow/join';
    var login_url = 'http://localhost:'+port+'/rainbow/login';
    
    var user1 = new user();
    user1.userId = "login@test.com";
    user1.userName = "test";
    
    
    it('join succeed',function(done){
        superagent
        .post(join_url)
        .send({ 'userId':user1.userId,'userName':user1.userName,'password':'123qwe' })
        .end(function(err,res){
            expect(res.status).equal(200);
            user1.loadJSON( res.body );
            expect(user1.validate()).equal(true);
            done();
        })            
    });
    
    it('login failed ( incorrect password )',function(done){
        superagent
        .post(login_url)
        .send({ 'user_id':user1.userId,'password':'234qwe' })
        .end(function(err,res){
            expect(res.status).to.equal(500);
            expect(res.body.errorCode).to.equal(6);
            done();
        })            
    });
    
    it('should login succeed',function(done){
        superagent
        .post(login_url)
        .send({ 'user_id':user1.userId,'password':'123qwe' })
        .end(function(err,res){
            expect(res.status).equal(200);
            user1.loadJSON( res.body );
            expect(user1.validate()).equal(true);
            done();
        })            
    });
    
    it('should login succeed ( use token )',function(done){
        superagent
        .post(login_url)
        .set({ 'token':user1.token })
        .end(function(err,res){
            expect(res.status).equal(200);
            user1.loadJSON( res.body );
            expect(user1.validate()).equal(true);
            
            done();
        })            
    });
    
    after('clean up test data', function(done) {
        mysql.getConnection( function (err, conn )
        {
            if( err ) throw err;
            
            var q1 = mysql.makeQuery("delete from Account where UserID in (%s)", user1.userId );
            conn.query( q1, function ( err ) {
                if( err ) throw err;
                
                var q2 = mysql.makeQuery("delete from `Group` where GroupSN in (%d)", user1.group.sn );
                conn.query( q2 , function ( err ) {
                    if( err ) throw err;
                    
                    conn.release();
                    
                    done();
                });
            });
        });
    });
});