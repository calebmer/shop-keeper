# TODOs

## Missing Features
- JSON support
- `POST` method does not return a `Location` header

## Optimizations
- Remove globals in tests, it effects the source code's execution
- Remove `ifNotExists()` from table creation in `demo/migrate/setup` and refactor tests that require a db setup to also perform a db teardown
- `query.js` refactor

## Possible Enhancements
- Find a better way to define `Api.getAccountableId`?
- Will only be able to `post` method if accountable for previous items? e.g. `POST`ing to `/person/2/posts` will only work if the API client proves it is accountable for `/person/2`
