const Team = require("../models/Team");
const TeamTask = require("../models/TeamTask");
const TeamTaskResponse = require("../models/TeamTaskResponse");
const ManagerTaskNotification = require("../models/ManagerTaskNotification");
const User = require("../models/User");
const { Op } = require("sequelize");

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    department: user.department,
    role: user.role,
  };
}

function toTeamView(team) {
  const members = team.members || [];
  const tasks = team.tasks || [];

  return {
    id: team.id,
    name: team.name,
    description: team.description,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
    managerId: team.managerId || null,
    manager: team.manager ? sanitizeUser(team.manager) : null,
    members: members.map((member) => ({
      userId: member.id,
      user: sanitizeUser(member),
    })),
    tasks: tasks.map((task) => ({
      id: task.id,
      taskName: task.taskName,
      description: task.description || "",
      attachments: task.attachments ? JSON.parse(task.attachments) : [],
      assignedBy: task.assignedBy,
      assignedAt: task.assignedAt,
      assigner: task.assigner ? sanitizeUser(task.assigner) : null,
      responses: (task.responses || []).map(r => ({
        id: r.id,
        message: r.message,
        attachments: r.attachments ? JSON.parse(r.attachments) : [],
        createdAt: r.createdAt,
        user: r.user ? sanitizeUser(r.user) : null,
      }))
    })),
  };
}

async function ensureTeamAccess(actor, id) {
  const teamId = Number(id);
  if (!teamId) {
    const error = new Error("teamId is required");
    error.status = 400;
    throw error;
  }

  const where = { id: teamId };
  if (actor.role === "manager") {
    const managerWhere = { id: teamId, managerId: actor.id };
    const managedTeam = await Team.findOne({ where: managerWhere, attributes: ["id"], raw: true });
    if (!managedTeam) {
      const actorUser = await User.findByPk(actor.id, { attributes: ["id", "teamId"] });
      if (!actorUser?.teamId || actorUser.teamId !== teamId) {
        const error = new Error("Team not found");
        error.status = 404;
        throw error;
      }
    }
  } else if (actor.role !== "admin") {
    const actorUser = await User.findByPk(actor.id, { attributes: ["id", "teamId"] });
    if (!actorUser?.teamId || actorUser.teamId !== teamId) {
      const error = new Error("Team not found");
      error.status = 404;
      throw error;
    }
  }

  const team = await Team.findOne({
    where,
    include: [
      { model: User, as: "manager", attributes: ["id", "name", "email", "department", "role"] },
      { model: User, as: "members", attributes: ["id", "name", "email", "department", "role", "teamId"] },
      {
        model: TeamTask,
        as: "tasks",
        include: [
          { model: User, as: "assigner", attributes: ["id", "name", "email", "department", "role"] },
          { model: TeamTaskResponse, as: "responses", include: [{ model: User, as: "user", attributes: ["id", "name", "email", "department", "role"] }] }
        ],
      },
    ],
    order: [
      [{ model: User, as: "members" }, "id", "ASC"],
      [{ model: TeamTask, as: "tasks" }, "id", "DESC"],
    ],
  });

  if (!team) {
    const error = new Error("Team not found");
    error.status = 404;
    throw error;
  }

  return team;
}

async function listTeams(actor) {
  const where = {};
  if (actor.role === "manager") {
    const actorUser = await User.findByPk(actor.id, { attributes: ["id", "teamId"] });
    const managedTeams = await Team.findAll({
      where: { managerId: actor.id },
      attributes: ["id"],
      raw: true,
    });
    const visibleTeamIds = new Set(managedTeams.map((team) => team.id));
    if (actorUser?.teamId) visibleTeamIds.add(actorUser.teamId);
    const ids = [...visibleTeamIds];
    if (!ids.length) return [];
    where.id = { [Op.in]: ids };
  } else if (actor.role !== "admin") {
    const actorUser = await User.findByPk(actor.id, { attributes: ["id", "teamId"] });
    if (!actorUser?.teamId) return [];
    where.id = actorUser.teamId;
  }

  const teams = await Team.findAll({
    where,
    include: [
      { model: User, as: "manager", attributes: ["id", "name", "email", "department", "role"] },
      { model: User, as: "members", attributes: ["id", "name", "email", "department", "role", "teamId"] },
      {
        model: TeamTask,
        as: "tasks",
        include: [
          { model: User, as: "assigner", attributes: ["id", "name", "email", "department", "role"] },
          { model: TeamTaskResponse, as: "responses", include: [{ model: User, as: "user", attributes: ["id", "name", "email", "department", "role"] }] }
        ],
      },
    ],
    order: [
      ["id", "DESC"],
      [{ model: User, as: "members" }, "id", "ASC"],
      [{ model: TeamTask, as: "tasks" }, "id", "DESC"],
    ],
  });

  return teams.map(toTeamView);
}

async function createTeam(actor, payload) {
  const name = payload.name?.trim();
  if (!name) {
    const error = new Error("Team name is required");
    error.status = 400;
    throw error;
  }

  let managerId = null;
  if (payload.managerId !== undefined && payload.managerId !== null && String(payload.managerId).trim() !== "") {
    managerId = Number(payload.managerId);
    if (!managerId) {
      const error = new Error("managerId must be a valid user id");
      error.status = 400;
      throw error;
    }

    const manager = await User.findByPk(managerId);
    // Allow both "manager" and "admin" roles as valid assignees for managerId
    if (!manager || (manager.role !== "manager" && manager.role !== "admin")) {
      const error = new Error("Manager not found");
      error.status = 404;
      throw error;
    }
  }

  const team = await Team.create({
    name,
    description: payload.description?.trim() || null,
    managerId,
  });

  return toTeamView(await ensureTeamAccess({ ...actor, role: "admin" }, team.id));
}

async function updateTeam(actor, id, payload) {
  const team = await ensureTeamAccess(actor, id);
  let managerId = team.managerId || null;

  if (payload.managerId !== undefined) {
    if (payload.managerId === null || String(payload.managerId).trim() === "") {
      managerId = null;
    } else {
      managerId = Number(payload.managerId);
      if (!managerId) {
        const error = new Error("managerId must be a valid user id");
        error.status = 400;
        throw error;
      }

      const manager = await User.findByPk(managerId);
      if (!manager || manager.role !== "manager") {
        const error = new Error("Manager not found");
        error.status = 404;
        throw error;
      }
    }
  }

  await team.update({
    name: payload.name?.trim() || team.name,
    description: payload.description !== undefined ? payload.description?.trim() || null : team.description,
    managerId,
  });

  return toTeamView(await ensureTeamAccess({ ...actor, role: "admin" }, team.id));
}

async function deleteTeam(actor, id) {
  const team = await ensureTeamAccess(actor, id);
  await team.destroy();
}

async function addMember(actor, teamId, payload) {
  const team = await ensureTeamAccess(actor, teamId);
  const targetTeamId = Number(payload.teamId || teamId);
  if (!targetTeamId || targetTeamId !== team.id) {
    const error = new Error("teamId must match URL team id");
    error.status = 400;
    throw error;
  }

  const userId = Number(payload.userId);

  if (!userId) {
    const error = new Error("userId is required");
    error.status = 400;
    throw error;
  }

  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  if (user.teamId === team.id) {
    const error = new Error("User is already a member of this team");
    error.status = 409;
    throw error;
  }

  // Keep one-team-only rule while allowing reassignment by admin:
  // assigning a user to a new team simply updates their single teamId.
  await user.update({ teamId: team.id });
  return toTeamView(await ensureTeamAccess({ ...actor, role: "admin" }, team.id));
}

async function removeMember(actor, teamId, userId) {
  const team = await ensureTeamAccess(actor, teamId);
  const memberId = Number(userId);
  if (!memberId) {
    const error = new Error("userId is required");
    error.status = 400;
    throw error;
  }

  await User.update({ teamId: null }, { where: { id: memberId, teamId: team.id } });
  return toTeamView(await ensureTeamAccess({ ...actor, role: "admin" }, team.id));
}

async function assignTask(actor, teamId, payload) {
  const team = await ensureTeamAccess(actor, teamId);
  const taskName = payload.taskName?.trim();
  const description = payload.description?.trim() || "";

  if (!taskName) {
    const error = new Error("taskName is required");
    error.status = 400;
    throw error;
  }

  const task = await TeamTask.create({
    teamId: team.id,
    taskName,
    description,
    attachments: payload.attachments || null,
    assignedBy: actor.id,
  });

  // Auto-notify designated team manager with task + team context.
  // Unique index (managerId + teamTaskId) prevents duplicate records.
  let managerNotification = null;
  if (team.managerId) {
    const [notification] = await ManagerTaskNotification.findOrCreate({
      where: { managerId: team.managerId, teamTaskId: task.id },
      defaults: {
        managerId: team.managerId,
        teamId: team.id,
        teamTaskId: task.id,
        taskName: task.taskName,
        description: task.description || "",
        teamName: team.name,
        assignedAt: task.assignedAt,
      },
    });
    managerNotification = {
      managerId: notification.managerId,
      taskTitle: notification.taskName,
      description: notification.description,
      assignedTeamName: notification.teamName,
      assignedAt: notification.assignedAt,
    };
  }

  return {
    id: task.id,
    taskName: task.taskName,
    description: task.description || "",
    attachments: task.attachments ? JSON.parse(task.attachments) : [],
    assignedBy: task.assignedBy,
    assignedAt: task.assignedAt,
    team: { id: team.id, name: team.name },
    managerNotification,
  };
}

async function listTeamTasks(actor, teamId) {
  const team = await ensureTeamAccess(actor, teamId);
  const hydrated = await ensureTeamAccess({ ...actor, role: "admin" }, team.id);
  return toTeamView(hydrated).tasks;
}

async function respondToTask(actor, taskId, payload) {
  const taskIdNum = Number(taskId);
  if (!taskIdNum) {
    const error = new Error("taskId is required");
    error.status = 400;
    throw error;
  }

  const task = await TeamTask.findByPk(taskIdNum);
  if (!task) {
    const error = new Error("Task not found");
    error.status = 404;
    throw error;
  }

  // Ensure user has access to the team the task belongs to
  await ensureTeamAccess(actor, task.teamId);

  const message = payload.message?.trim();
  if (!message && !payload.attachments) {
    const error = new Error("Message or attachments are required");
    error.status = 400;
    throw error;
  }

  const response = await TeamTaskResponse.create({
    teamTaskId: task.id,
    userId: actor.id,
    message: message || "",
    attachments: payload.attachments || null,
  });

  const hydratedResponse = await TeamTaskResponse.findByPk(response.id, {
    include: [{ model: User, as: "user", attributes: ["id", "name", "email", "department", "role"] }]
  });

  return {
    id: hydratedResponse.id,
    message: hydratedResponse.message,
    attachments: hydratedResponse.attachments ? JSON.parse(hydratedResponse.attachments) : [],
    createdAt: hydratedResponse.createdAt,
    user: hydratedResponse.user ? sanitizeUser(hydratedResponse.user) : null,
  };
}

module.exports = {
  listTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
  assignTask,
  listTeamTasks,
  respondToTask,
};
