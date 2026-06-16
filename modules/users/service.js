import { generateSaltAndHash, validatePassword } from "../../lib/utils";
import { HttpError } from "../shared/http-error";
import {
  createUser,
  findAllUsers,
  findUserById,
  softDeleteUserById,
  updateUserById,
} from "./repository";

function mapUserImage(user) {
  if (!user) return user;
  if (!user.image) return user;
  return { ...user, image: user.image.toString("utf-8") };
}

function isSelf(actorUser, userId) {
  return actorUser?.id && actorUser.id === userId;
}

function buildUserScopeWhere(actorUser) {
  if (actorUser.role === "SUPER") return {};
  if (actorUser.role === "ADMIN") {
    if (!actorUser.workspaceId) return { id: actorUser.id };
    return { workspaceId: actorUser.workspaceId };
  }
  return { id: actorUser.id };
}

function assertUserReachable(actorUser, targetUser) {
  if (!targetUser) {
    throw new HttpError(404, "User not found");
  }

  if (actorUser.role === "SUPER") return;

  if (isSelf(actorUser, targetUser.id)) return;

  if (actorUser.role === "ADMIN") {
    if (
      actorUser.workspaceId &&
      targetUser.workspaceId === actorUser.workspaceId
    ) {
      return;
    }
  }

  throw new HttpError(403, "You cannot access this user");
}

export async function listUsersService(actorUser) {
  const where = buildUserScopeWhere(actorUser);
  const users = await findAllUsers(where);
  return users.map(mapUserImage);
}

export async function getUserByIdService(userId, fallbackUserId, actorUser) {
  const targetId = userId || fallbackUserId;
  const docUser = await findUserById(targetId);
  assertUserReachable(actorUser, docUser);
  return mapUserImage(docUser);
}

export async function createUserService(payload, actorUser) {
  const {
    name,
    email,
    role,
    password,
    image = null,
    workspaceId: payloadWorkspaceId,
  } = payload;

  if (actorUser.role === "USER") {
    throw new HttpError(403, "Only admins can create users");
  }

  let workspaceId;
  let finalRole = role;

  if (actorUser.role === "SUPER") {
    workspaceId = payloadWorkspaceId ?? null;
  } else {
    // ADMIN: can only create users inside their own workspace, and
    // cannot promote anyone to SUPER.
    if (!actorUser.workspaceId) {
      throw new HttpError(403, "You need a workspace to create users");
    }
    workspaceId = actorUser.workspaceId;
    if (finalRole === "SUPER") {
      throw new HttpError(403, "You cannot assign the SUPER role");
    }
  }

  const { salt, hash } = generateSaltAndHash({ password });
  const data = { name, email, role: finalRole, salt, hash, workspaceId };

  if (image) {
    data.image = Buffer.from(image, "utf-8");
  }

  try {
    return await createUser(data);
  } catch (error) {
    if (error?.code === "P2002") {
      throw new HttpError(409, "User already exists with this email");
    }
    throw error;
  }
}

export async function updateUserService(actorUser, payload) {
  const target = await findUserById(payload.userId);
  if (!target) {
    throw new HttpError(404, "User not found");
  }

  const self = isSelf(actorUser, target.id);
  const actorRole = actorUser.role;

  const canEdit =
    actorRole === "SUPER" ||
    self ||
    (actorRole === "ADMIN" &&
      actorUser.workspaceId &&
      target.workspaceId === actorUser.workspaceId);

  if (!canEdit) {
    throw new HttpError(403, "You cannot update this user");
  }

  const data = {};

  if (payload.name !== undefined) data.name = payload.name;
  if (payload.email !== undefined) data.email = payload.email;

  if (payload.role !== undefined && payload.role !== target.role) {
    if (self && actorRole !== "SUPER") {
      throw new HttpError(403, "You cannot change your own role");
    }
    if (actorRole === "SUPER") {
      data.role = payload.role;
    } else if (actorRole === "ADMIN") {
      if (payload.role === "SUPER") {
        throw new HttpError(403, "You cannot assign the SUPER role");
      }
      data.role = payload.role;
    }
  }

  if (actorRole === "SUPER" && payload.workspaceId !== undefined) {
    data.workspaceId = payload.workspaceId || null;
  }

  if (payload.image) {
    data.image = Buffer.from(payload.image, "utf-8");
  }

  if (payload.language !== undefined) {
    data.language = payload.language;
  }

  if (payload.password) {
    const { salt, hash } = generateSaltAndHash({ password: payload.password });
    data.salt = salt;
    data.hash = hash;
  }

  if (Object.keys(data).length === 0) {
    throw new HttpError(400, "No fields to update");
  }

  await updateUserById(payload.userId, data);
}

export async function updateProfileService(actorUser, payload) {
  const current = await findUserById(actorUser.id);
  if (!current) {
    throw new HttpError(404, "User not found");
  }

  const data = {};

  if (payload.name !== undefined) data.name = payload.name;
  if (payload.language !== undefined) data.language = payload.language;

  if (payload.password) {
    if (!current.salt || !current.hash) {
      throw new HttpError(400, "This account has no password set");
    }

    const isValidCurrent = validatePassword({
      user: { salt: current.salt, hash: current.hash },
      inputPassword: payload.currentPassword,
    });

    if (!isValidCurrent) {
      throw new HttpError(
        400,
        "Your current password is incorrect",
        "INVALID_CURRENT_PASSWORD",
      );
    }

    const { salt, hash } = generateSaltAndHash({ password: payload.password });
    data.salt = salt;
    data.hash = hash;
  }

  if (Object.keys(data).length === 0) {
    throw new HttpError(400, "No fields to update");
  }

  await updateUserById(actorUser.id, data);

  return { language: data.language ?? current.language };
}

export async function deleteUserService(actorUser, userId) {
  if (!userId) {
    throw new HttpError(400, "userId is required");
  }

  if (isSelf(actorUser, userId)) {
    throw new HttpError(400, "You cannot delete your own account");
  }

  const target = await findUserById(userId);
  if (!target) {
    throw new HttpError(404, "User not found");
  }

  const actorRole = actorUser.role;

  const canDelete =
    actorRole === "SUPER" ||
    (actorRole === "ADMIN" &&
      actorUser.workspaceId &&
      target.workspaceId === actorUser.workspaceId &&
      target.role !== "SUPER");

  if (!canDelete) {
    throw new HttpError(403, "You cannot delete this user");
  }

  await softDeleteUserById(userId);
}
