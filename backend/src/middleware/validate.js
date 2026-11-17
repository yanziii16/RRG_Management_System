const { badRequest } = require('../utils/errors');

// validate(schema) checks req.body; validate(schema, 'query') or 'params' check those instead
module.exports = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    const first = details[0];
    const label = first.field ? `${first.field} ${first.message}` : first.message;
    return next(badRequest(`Validation failed: ${label}`, details));
  }
  req[source] = result.data;
  next();
};