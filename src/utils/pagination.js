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
  if (query.search === undefined || query.search === null) {
    return "";
  }

  return String(query.search).trim();
};

const parseGstPercentQuery = (query = {}) => {
  if (query.gst_percent === undefined || query.gst_percent === null) {
    return null;
  }

  const raw = String(query.gst_percent).trim();
  if (raw === "") {
    return null;
  }

  if (!/^\d+(\.\d+)?$/.test(raw)) {
    throw httpError("gst_percent must be a valid numeric percentage", 400);
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value > 100) {
    throw httpError("gst_percent must be a finite percentage between 0 and 100", 400);
  }

  return value;
};

const parseUnitQuery = (query = {}) => {
  if (query.unit === undefined || query.unit === null) {
    return "";
  }

  return String(query.unit).trim();
};

const parseEnumQuery = (query = {}, fieldName, allowedValues) => {
  const value = query[fieldName];
  if (value === undefined || value === null) {
    return "";
  }

  const raw = String(value).trim();
  if (raw === "") {
    return "";
  }

  const normalized = raw.toUpperCase();
  if (!allowedValues.includes(normalized)) {
    throw httpError(
      `${fieldName} must be one of: ${allowedValues.join(", ")}`,
      400
    );
  }

  return normalized;
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
  parseGstPercentQuery,
  parseUnitQuery,
  parseEnumQuery,
  escapeIlikePattern,
  buildPagination,
};
