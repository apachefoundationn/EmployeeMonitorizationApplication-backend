const CorrectionRequest = require("../models/CorrectionRequest");
const User = require("../models/User");

function toRequestView(request) {
  return {
    id: request.id,
    employeeId: request.employeeId,
    date: request.date,
    reason: request.reason,
    status: request.status,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    employee: request.User
      ? {
          id: request.User.id,
          name: request.User.name,
          email: request.User.email,
          department: request.User.department,
        }
      : null,
  };
}

async function createRequest(actor, { date, reason }) {
  if (!date || !reason?.trim()) {
    const error = new Error("date and reason are required");
    error.status = 400;
    throw error;
  }

  const request = await CorrectionRequest.create({
    employeeId: actor.id,
    date,
    reason: reason.trim(),
    status: "pending",
  });

  const hydrated = await CorrectionRequest.findByPk(request.id, {
    include: [{ model: User, attributes: ["id", "name", "email", "department"] }],
  });

  return toRequestView(hydrated);
}

async function listRequests(actor, filters = {}) {
  const where = {};

  if (filters.status && filters.status !== "all") {
    where.status = filters.status;
  }

  if (actor.role === "employee") {
    where.employeeId = actor.id;
  }

  const requests = await CorrectionRequest.findAll({
    where,
    include: [{ model: User, attributes: ["id", "name", "email", "department"] }],
    order: [["createdAt", "DESC"]],
  });

  return requests.map(toRequestView);
}

async function getRequestForActor(actor, id) {
  const request = await CorrectionRequest.findByPk(id, {
    include: [{ model: User, attributes: ["id", "name", "email", "department"] }],
  });

  if (!request) {
    const error = new Error("Request not found");
    error.status = 404;
    throw error;
  }

  if (actor.role === "admin") return request;

  if (request.employeeId !== actor.id) {
    const error = new Error("Forbidden");
    error.status = 403;
    throw error;
  }

  return request;
}

async function changeRequestStatus(actor, id, status) {
  if (!["approved", "rejected"].includes(status)) {
    const error = new Error("status must be approved or rejected");
    error.status = 400;
    throw error;
  }

  if (actor.role !== "admin") {
    const error = new Error("Forbidden");
    error.status = 403;
    throw error;
  }

  const request = await getRequestForActor(actor, id);
  request.status = status;
  await request.save();

  return toRequestView(request);
}

module.exports = {
  createRequest,
  listRequests,
  changeRequestStatus,
};
