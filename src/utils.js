import _ from 'lodash';

export function sendToTop(array, item) {

  if (_.contains(array, item)) {
    _.pull(array, item);
    array.unshift(item);
  }
}

export function sendToBottom(array, item) {

  if (_.contains(array, item)) {
    _.pull(array, item);
    array.push(item);
  }
}
