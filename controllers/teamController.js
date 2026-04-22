const teamService = require("../services/teamService");

function sendSuccess(res, status, data) {
  return res.status(status).json({ success: true, data });
}

exports.getTeams = async (req, res) => {
  try {
    const teams = await teamService.listTeams(req.user);
    sendSuccess(res, 200, teams);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.createTeam = async (req, res) => {
  try {
    const team = await teamService.createTeam(req.user, req.body);
    sendSuccess(res, 201, team);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const team = await teamService.updateTeam(req.user, req.params.id, req.body);
    sendSuccess(res, 200, team);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    await teamService.deleteTeam(req.user, req.params.id);
    sendSuccess(res, 200, { message: "Team deleted successfully" });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const team = await teamService.addMember(req.user, req.params.id, req.body);
    sendSuccess(res, 200, team);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const team = await teamService.removeMember(req.user, req.params.id, req.params.userId);
    sendSuccess(res, 200, team);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.assignTask = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (req.files && req.files.length > 0) {
      payload.attachments = JSON.stringify(req.files.map(f => `/uploads/${f.filename}`));
    }
    const task = await teamService.assignTask(req.user, req.params.teamId, payload);
    sendSuccess(res, 201, task);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.getTeamTasks = async (req, res) => {
  try {
    const tasks = await teamService.listTeamTasks(req.user, req.params.teamId);
    sendSuccess(res, 200, tasks);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.respondToTask = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (req.files && req.files.length > 0) {
      payload.attachments = JSON.stringify(req.files.map(f => `/uploads/${f.filename}`));
    }
    const response = await teamService.respondToTask(req.user, req.params.taskId, payload);
    sendSuccess(res, 201, response);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
