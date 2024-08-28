function getKeyByValue(obj, value) {
  for (const key in obj) {
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(key) && obj[key] === value) {
      return key;
    }
  }
}

function truncateToNullTerminator(str) {
  const nullTerminatorIndex = str.indexOf("\0");
  if (nullTerminatorIndex !== -1) {
    return str.slice(0, nullTerminatorIndex);
  } else {
    return str;
  }
}

module.exports = {
  getKeyByValue: getKeyByValue,
  truncateToNullTerminator: truncateToNullTerminator,
};
