Request = require './lib/request'

# TODO: consider unit testing the actual `Router` and `Api` objects
describe 'the routes', ->
  before require './lib/setup'

  it 'will not find things that do not exist', (done) ->
    Request()
    .get '/not-found'
    .expect 404
    .end done

  it 'will fail if a bad method is used', (done) ->
    Request()
    .put '/person/1'
    .expect 405
    .end done

  it 'will only return headers for `head` requests', (done) ->
    Request()
    .head '/person/1'
    .expect 200
    .end (e, res) ->
      return done e if e?
      res.headers.should.have.property 'content-length'
      res.should.have.property 'text', ''
      done()

  it 'can find a collection endpoint'
  it 'can find a record endpoint'

  it 'will find a forward join', (done) ->
    Request()
    .get '/post/3/author'
    .expect 200
    .end (e, res) ->
      return done e if e?
      res.body.should.have.property 'id', 2
      res.body.should.have.property 'givenName', 'Jon'
      res.body.should.have.property 'familyName', 'Smith'
      done()

  it 'can update from a forward join', (done) ->
    Request()
    .patch '/post/3/author'
    .send givenName: 'Johnny'
    .expect 200
    .end (e, res) ->
      return done e if e?
      Request()
      .get '/person/2'
      .expect 200
      .end (e, res) ->
        return done e if e?
        res.body.should.have.property 'givenName', 'Johnny'
        done()

  it 'cannot delete from a forward join', (done) ->
    Request()
    .delete '/post/3/author'
    .expect 403
    .end done

  it 'will find a reverse join', (done) ->
    Request()
    .get '/person/2/posts'
    .expect 200
    .end (e, res) ->
      return done e if e?
      res.body.should.be.an.Array()
      res.body.forEach (document) ->
        document.should.have.property 'headline'
        document.should.have.property 'authorId', 2
      done()

  it 'will apply the reverse join properties on insert', (done) ->
    Request()
    .post '/person/2/posts'
    .send headline: 'Hello, world!'
    .expect 201
    .end (e, res) ->
      return done e if e?
      Request()
      .get '/post/' + res.headers['record-id']
      .expect 200
      .end (e, res) ->
        return done e if e?
        res.body.should.have.property 'headline', 'Hello, world!'
        res.body.should.have.property 'authorId', 2
        done()
