import _ from 'lodash';
import Database from './database';

let internals = {};

// Slight optimization
internals.selectJoins = _.memoize(collection => {

  let { table, joins } = collection;
  let select = [];
  let froms = [];

  joins.forEach(({ collection: joinCollection, ...join }) => {

    let { access: joinAccess, table: joinTable } = joinCollection;
    joinTable = joinTable.as(join.name);

    // If the collections are the same, skip it
    if (collection === joinCollection) { return; }

    select = select.concat(joinAccess.getProperties('terse')
      .map(property => joinTable[property].as(`${join.name}.${property}`)));

    froms.push(
      table.leftJoin(joinTable)
      .on(table[join.property].equals(joinTable.id))
    );
  });

  return { select, froms };
}, collection => collection.name);

export function selectJoins(collection) {

  let { select, froms } = internals.selectJoins(collection);
  return this.select(select).from(froms);
}

export function denormalizeExec(callback) {

  return Database.exec(this, (error, records) => callback(error, records ?
    records.map(record => {

      let newRecord = {};
      _.each(record, (value, key) => _.set(newRecord, key, value));
      return newRecord;
    })
  : null));
}
