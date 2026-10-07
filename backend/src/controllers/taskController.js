import * as taskService from "../services/taskService.js";

export async function getAllTasks(request, response) {
  const { status } = request.query;
  const tasks = await taskService.listTasks(request.userId, { status });
  response.status(200).json({ message: 'Liste des taches', tasks: tasks });
}
