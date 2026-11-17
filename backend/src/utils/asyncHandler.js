// Lets async route handlers send their errors to the error middleware
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);