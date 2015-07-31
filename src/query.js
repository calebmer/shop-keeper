import _ from 'lodash';
import Async from 'async';
import {exec} from './database';

export function selectJoins(collection, level = 'terse') {

  let { table, joins, access } = collection;
  let properties = access.getProperties(level);
  let select = [];
  let froom;

  joins.forEach(({ collection: joinCollection, ...join }) => {

    if (!_.contains(properties, join.property)) { return; }
    if (collection === joinCollection) { return; }

    let { access: joinAccess, table: joinTable } = joinCollection;
    joinTable = joinTable.as(join.name);

    select = select.concat(joinAccess.getProperties('terse').map(property =>
      joinTable[property].as(`${join.name}.${property}`)
    ));

    froom =
    (froom ? froom : table).leftJoin(joinTable)
    .on(table[join.property].equals(joinTable.id));
  });

  let query = this.select(select);
  if (froom) { query.from(froom); }

  return query;
}

export function denormalizeExec(collection, callback) {

  let {joins} = collection;

  Async.waterfall([
    done => (this)::exec(done),
    (records, done) => {

      Async.map(records, (record, nextMap) => {

        let newRecord = {};
        _.each(record, (value, key) => _.set(newRecord, key, value));

        Async.each(joins, (join, nextEach) => {

          let { name, collection: joinCollection } = join;
          if (!newRecord[name]) { return nextEach(); }

          joinCollection.executeHook('read', newRecord[name], nextEach);
        }, error => {

          if (error) { return nextMap(error); }
          nextMap(null, newRecord);
        });
      }, done);
    }
  ], callback);
}
