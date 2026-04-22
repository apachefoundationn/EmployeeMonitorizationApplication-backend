const requestService = require("../services/requestService");

exports.createRequest = async (req, res) => {
  try {
    const request = await requestService.createRequest(req.user, req.body);
    res.status(201).json(request);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const requests = await requestService.listRequests(req.user, req.query);
    res.json(requests);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const request = await requestService.changeRequestStatus(req.user, req.params.id, req.body.status);
    res.json(request);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const request = await requestService.changeRequestStatus(req.user, req.params.id, "approved");
    res.json(request);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const request = await requestService.changeRequestStatus(req.user, req.params.id, "rejected");
    res.json(request);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};