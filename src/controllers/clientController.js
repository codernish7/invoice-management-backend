const { createClient,getClients,updateClient,getClientById } = require("../services/clientService");
const {
  parsePaginationQuery,
  parseSearchQuery,
  buildPagination,
} = require("../utils/pagination");

const createClientController = async (req, res) => {
  try {
    const client = await createClient(req.body, req.company.id);
    res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: client,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error.message });
  }
};

const updateClientController = async (req, res) => {
  try {
    const client = await updateClient(req.params.clientId, req.body, req.company.id);
    res.status(200).json({
      success: true,
      message: "Client updated successfully",
      data: client,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error.message });
  }
}

const getClientsController = async(req,res)=>{
  try {
    const { page, limit } = parsePaginationQuery(req.query);
    const search = parseSearchQuery(req.query);
    const { data, totalItems } = await getClients(req.company.id, {
      minimal: req.query.minimal === "true",
      page,
      limit,
      search,
    });

    res.status(200).json({
      success: true,
      message: "Clients fetched successfully",
      data,
      pagination: buildPagination({ page, limit, totalItems }),
    });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status >= 500) {
      console.log(error);
    }
    res.status(status).json({
      success: false,
      message: status === 500 ? "Internal server error" : error.message,
    });
  }
}

const getClientByIdController = async(req,res)=>{
  try {
    const client = await getClientById(req.params.clientId, req.company.id);
    res.status(200).json({ success: true, message: "Client fetched successfully", data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}
module.exports = { createClientController, getClientsController, updateClientController, getClientByIdController };