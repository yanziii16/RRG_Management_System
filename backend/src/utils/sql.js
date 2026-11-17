// Builds "UPDATE table SET a = $1, b = $2 WHERE id = $3". Column names come only from validated schemas.
function buildUpdate(table, id, data) {
  const keys = Object.keys(data).filter((key) => data[key] !== undefined);
  const sets = keys.map((key, i) => `${key} = $${i + 1}`);
  return {
    text: `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${keys.length + 1} RETURNING *`,
    values: [...keys.map((key) => data[key]), id],
  };
}

// Escapes % and _ so a search text is matched literally
const likeValue = (text) => `%${text.replace(/[\\%_]/g, '\\$&')}%`;

module.exports = { buildUpdate, likeValue };