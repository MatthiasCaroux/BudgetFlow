import { Task } from "../models/Task.js";

export function listTasks (ownerId, { status } = {}){
    const filter = { ownerId };
    if (status) filter.status = status;
    return Task.find(filter).sort({ createdAt: -1 });
};

