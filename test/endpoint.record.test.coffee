Request = require './utils/request'

describe 'a record endpoint', ->
  before require './utils/setup'

  it 'will not find a record that does not exist', (done) ->
    Request()
    .head '/person/abcd'
    .expect 404
    .end done

  it 'will expose a record id header', (done) ->
    Request()
    .head '/person/1'
    .expect 200
    .expect 'Record-Id', 1
    .end done

  describe 'get method', ->
    it 'will return an object', (done) ->
      Request()
      .get '/person/1'
      .expect 200
      .end (e, res) ->
        return done e if e?
        res.body.should.not.be.an.Array()
        res.body.should.be.an.Object()
        done()

    it 'will return the public form of an object', (done) ->
      Request()
      .get '/person/1'
      .expect 200
      .end (e, res) ->
        return done e if e?
        res.body.should.have.property 'givenName'
        res.body.should.have.property 'familyName'
        res.body.should.not.have.property 'email'
        done()

    it 'will expose a header negotiating accountability', (done) ->
      Request()
      .get '/person/1'
      .expect 200
      .expect 'Record-Accountable', 0
      .end (e) ->
        return done e if e?
        Request()
        .get '/person/1?accountable=1'
        .expect 200
        .expect 'Record-Accountable', 1
        .end done

    it 'will denormalize the data', (done) ->
      Request()
      .get '/post/1'
      .expect 200
      .end (e, res) ->
        return done e if e?
        res.body.should.have.property 'author'
        res.body.author.should.have.property 'id', res.body.authorId
        res.body.author.should.have.property 'givenName'
        res.body.author.should.not.have.property 'familyName'
        res.body.author.should.have.property 'createdAt'
        done()

    it 'can return the private form of an object with credentials', (done) ->
      Request()
      .get '/person/2?accountable=2'
      .expect 200
      .end (e, res) ->
        return done e if e?
        res.body.should.have.property 'givenName'
        res.body.should.have.property 'familyName'
        res.body.should.have.property 'email'
        done()

  describe 'patch method', ->
    it 'only accepts json', (done) ->
      Request()
      .patch '/person/1'
      .send 'abcd'
      .expect 406
      .end done

    it 'requires authorization', (done) ->
      Request()
      .patch '/person/1'
      .send givenName: 'Sarah'
      .expect 401
      .end done

    it 'will patch a document', (done) ->
      Request()
      .patch '/person/2?accountable=2'
      .send givenName: 'Jon'
      .expect 200
      .end (e) ->
        return done e if e?
        Request()
        .get '/person/2'
        .expect 200
        .end (e, res) ->
          return done e if e?
          res.body.givenName.should.be.exactly 'Jon'
          done()

    it 'will validate before update', (done) ->
      Request()
      .patch '/person/2?accountable=2'
      .send
        familyName: 'A'
        email: 'sara.smith@email.com'
        password: 'abcd1234'
        lalala: false
      .expect 400
      .end (e, res) ->
        return done e if e?
        res.body.validationErrors.length.should.be.exactly 3
        Request()
        .get '/person/1'
        .expect 200
        .end (e, res) ->
          return done e if e?
          res.body.familyName.should.not.be.exactly 'A'
          res.body.should.not.have.property 'lalala'
          done()

  describe 'delete method', ->
    it 'requires authorization', (done) ->
      Request()
      .delete '/post/1'
      .expect 401
      .end done

    it 'will delete a document', (done) ->
      Request()
      .delete '/post/1?accountable=2'
      .expect 200
      .end (e) ->
        return done e if e?
        Request()
        .get '/post/1'
        .expect 404
        .end done
