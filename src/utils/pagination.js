const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const parsePositiveInteger = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const raw = String(value);
  if (!/^[1-9]\d*$/.test(raw)) {
    throw httpError(`${fieldName} must be a positive integer`, 400);
  }

  return Number(raw);
};

const parsePaginationQuery = (query = {}) => {
  const page = parsePositiveInteger(query.page, "page") ?? DEFAULT_PAGE;
  let limit = parsePositiveInteger(query.limit, "limit") ?? DEFAULT_LIMIT;

  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
};

const parseSearchQuery = (query = {}) => {
  if (typeof query.search !== "string") {
    return "";
  }

  return query.search.trim();
};

const escapeIlikePattern = (value) =>
  value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");

const buildPagination = ({ page, limit, totalItems }) => {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: totalPages > 0 && page < totalPages,
    hasPreviousPage: page > 1,
  };
};

module.exports = {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  parsePaginationQuery,
  parseSearchQuery,
  escapeIlikePattern,
  buildPagination,
};
