import _ from 'lodash';
import {exec} from './database';

let internals = {};

// Slight optimization
internals.selectJoins = _.memoize(collection => {

  let { table, joins } = collection;
  let select = [];
  let froom;

  joins.forEach(({ collection: joinCollection, ...join }) => {

    let { access: joinAccess, table: joinTable } = joinCollection;
    joinTable = joinTable.as(join.name);

    // If the collections are the same, skip it
    if (collection === joinCollection) { return; }

    select = select.concat(joinAccess.getProperties('terse')
      .map(property => joinTable[property].as(`${join.name}.${property}`)));

    froom =
    (froom ? froom : table).leftJoin(joinTable)
    .on(table[join.property].equals(joinTable.id));
  });

  return { select, froom };
}, collection => collection.name);

export function selectJoins(collection) {

  let { select, froom } = internals.selectJoins(collection);
  let query = this.select(select);
  if (froom) { query.from(froom); }
  return query;
}

export function denormalizeExec(callback) {

  return (this)::exec((error, records) => callback(error, records ?
    records.map(record => {

      let newRecord = {};
      _.each(record, (value, key) => _.set(newRecord, key, value));
      return newRecord;
    })
  : null));
}
