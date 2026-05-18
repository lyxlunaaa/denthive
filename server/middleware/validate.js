function requireFields(fields, body) {
  for (const f of fields) {
    if (body[f] === undefined || body[f] === null || String(body[f]).trim() === '') return f;
  }
  return null;
}

module.exports = {
  requireFields
};

