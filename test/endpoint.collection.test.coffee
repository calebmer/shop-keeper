Async = require 'async'
ShopKeeper = require '../lib'
Person = require '../demo/models/person'
Request = require './lib/request'

describe 'a collection endpoint', ->
  before require './lib/setup'

  describe 'post method', ->
    it 'only accepts json', (done) ->
      Request()
      .post '/person'
      .send 'abcd'
      .expect 406
      .end done

    it 'will insert a document', (done) ->
      Request()
      .post '/person'
      .send
        givenName: 'Sara'
        familyName: 'Smith'
        email: 'sara.smith@email.com'
      .expect 201
      .end done

    it 'will validate before insertion', (done) ->
      Request()
      .post '/person'
      .send
        familyName: 'A'
        email: 'sara.smith@email.com'
        password: 'abcd1234'
        lalala: false
      .expect 400
      .end (e, res) ->
        return done e if e?
        res.body.validationErrors.length.should.be.exactly 5
        done()

    it 'will fire the insert hook', (done) ->
      Request()
      .post '/person'
      .send
        givenName: 'John'
        familyName: 'Smith'
        email: 'john.smith@email.com'
        password: 'password!'
      .expect 201
      .end (e, res) ->
        return done e if e?
        query = Person.table
        .select 'password'
        .where id: parseInt res.headers['record-id']
        .limit 1
        ShopKeeper.executeQuery query, (e, results) ->
          return done e if e?
          results[0].password.should.be.exactly 'PASSWORD!'
          done()

    it 'will expose a record id header on success', (done) ->
      Request()
      .post '/person'
      .send
        givenName: 'Test'
        familyName: 'User'
        email: 'test.user@email.com'
      .expect 201
      .expect 'Record-Id', 3
      .end done

  describe 'get method', ->
    before (done) ->
      Async.each [1..33], (index, next) ->
        Request()
        .post '/post'
        .send
          headline: 'Post ' + index
          authorId: if index % 2 == 0 then 1 else 2
        .expect 201
        .end next
      , done

    it 'will return an array', (done) ->
      Request()
      .get '/post'
      .expect 200
      .end (e, res) ->
        return done e if e?
        res.body.should.be.an.Array()
        done()

    it 'will return the terse form of the documents', (done) ->
      Request()
      .get '/person'
      .expect 200
      .end (e, res) ->
        return done e if e?
        res.body[0].should.not.have.property 'familyName'
        res.body[0].should.not.have.property 'email'
        res.body[1].should.not.have.property 'familyName'
        res.body[1].should.not.have.property 'email'
        done()

    it 'will denormalize the data', (done) ->
      Request()
      .get '/post'
      .expect 200
      .end (e, res) ->
        return done e if e?
        res.body[0].should.have.property 'author'
        res.body[0].author.should.have.property 'id', res.body[0].authorId
        res.body[0].author.should.have.property 'givenName'
        res.body[0].author.should.not.have.property 'familyName'
        res.body[0].author.should.have.property 'createdAt'
        done()

    it 'will limit results to 16 by default', (done) ->
      Request()
      .get '/post'
      .expect 200
      .end (e, res) ->
        return done e if e?
        res.body.length.should.be.exactly 16
        done()

    it 'can change its default limit', (done) ->
      Request()
      .get '/post?limit=5'
      .expect 200
      .end (e, res) ->
        return done e if e?
        res.body.length.should.be.exactly 5
        done()

    it 'can be navigated by page', (done) ->
      Request()
      .get '/post?limit=16&page=2'
      .expect 200
      .end (e, res) ->
        return done e if e?
        res.body.length.should.be.exactly 1
        done()

    it 'exposes navigation links in header'
    it 'is ordered by `createdAt`'
    it 'can be ordered by anything'

    it 'will filter the data', (done) ->
      Request()
      .get '/post?limit=100&authorId=2'
      .expect 200
      .end (e, res) ->
        return done e if e?
        res.body.length.should.be.exactly 17
        done()
