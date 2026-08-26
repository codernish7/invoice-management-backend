const { createClient,getClient } = require("../services/clientService");

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

const getClientController = async(req,res)=>{
  
  try {
    const viewClients = await getClient(req.company.id, req.query.minimal === "true" )
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

module.exports = { createClientController, getClientController };
