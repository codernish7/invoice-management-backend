const { createClient,getClients,updateClient,getClientById } = require("../services/clientService");

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
    const viewClients = await getClients(req.company.id, req.query.minimal === "true" )
    res.status(200).json({
      success: true,
      message: "Clients fetched successfully",
      data: viewClients,
    })
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ success: false , message: "Internal server error" });
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