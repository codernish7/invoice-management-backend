// Temporary until JWT auth (TODO 14). Company id must be a UUID string — never an integer.
// Replace with a real company.id from the DB when manually testing protected routes before login exists.
const DEV_COMPANY_UUID = "00000000-0000-4000-8000-000000000001";

const fakeAuth = (req, res, next) => {
  req.company = { id: DEV_COMPANY_UUID };
  next();
};

module.exports = { fakeAuth };