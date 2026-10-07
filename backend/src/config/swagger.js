import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerJsdoc from 'swagger-jsdoc';

// Le motif glob de swagger-jsdoc exige des "/", y compris sous Windows
const currentDir = path.dirname(fileURLToPath(import.meta.url)).replaceAll('\\', '/');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BudgetFlow API',
      version: '1.0.0',
      description: "Documentation de l'API BudgetFlow",
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 3000}` }],
    components: {
      schemas: {
        Task: {
          type: 'object',
          required: ['title', 'description', 'deadline', 'ownerId'],
          properties: {
            _id: { type: 'string', example: '66f1c2a4e1b2c3d4e5f60718' },
            title: { type: 'string', example: 'Faire les courses' },
            description: { type: 'string', example: 'Acheter du pain et du lait' },
            status: {
              type: 'string',
              enum: ['pending', 'in progress', 'completed'],
              default: 'pending',
            },
            deadline: { type: 'string', format: 'date-time' },
            ownerId: { type: 'string', example: '66f1c2a4e1b2c3d4e5f60719' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  // Chemins absolus : fonctionne que le serveur soit lancé depuis la racine ou depuis backend/
  apis: [`${currentDir}/../app.js`, `${currentDir}/../routes/*.js`],
};

export const swaggerSpec = swaggerJsdoc(options);
