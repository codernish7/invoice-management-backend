const fakeAuth = (req, res, next) => {
  req.company = { id:1 };
  next();
};
module.exports={fakeAuth}