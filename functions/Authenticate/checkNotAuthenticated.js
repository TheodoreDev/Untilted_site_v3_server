function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.json(athenticate)
    }
    next()
}

module.exports = checkNotAuthenticated