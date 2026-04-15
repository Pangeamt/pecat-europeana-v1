import { generateSaltAndHash } from "../../lib/utils";
import { HttpError } from "../shared/http-error";
import {
  createUser,
  findAllUsers,
  findUserById,
  updateUserById,
} from "./repository";

function mapUserImage(user) {
  if (!user) return user;
  if (!user.image) return user;
  return { ...user, image: user.image.toString("utf-8") };
}

export async function listUsersService() {
  const users = await findAllUsers();
  return users.map(mapUserImage);
}

export async function getUserByIdService(userId, fallbackUserId) {
  const docUser = await findUserById(userId || fallbackUserId);
  if (!docUser) {
    throw new HttpError(404, "User not found");
  }
  return mapUserImage(docUser);
}

export async function createUserService(payload) {
  const { name, email, role, password, image = null } = payload;
  const { salt, hash } = generateSaltAndHash({ password });
  const data = { name, email, role, salt, hash };

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
  if (actorUser.role !== "ADMIN" || actorUser.id !== payload.userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const data = {
    name: payload.name,
    email: payload.email,
    role: payload.role,
  };

  if (actorUser.role === "USER") {
    data.role = "USER";
  }

  if (payload.image) {
    data.image = Buffer.from(payload.image, "utf-8");
  }

  if (payload.password) {
    const { salt, hash } = generateSaltAndHash({ password: payload.password });
    data.salt = salt;
    data.hash = hash;
  }

  await updateUserById(payload.userId, data);
}

