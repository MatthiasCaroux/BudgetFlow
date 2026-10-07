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
      // Permet de coller un token JWT via le bouton "Authorize" de Swagger UI
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Credentials: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'jean@exemple.com' },
            password: { type: 'string', minLength: 8, example: 'motdepasse123' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: '66f1c2a4e1b2c3d4e5f60719' },
                email: { type: 'string', example: 'jean@exemple.com' },
              },
            },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          },
        },
        TransactionInput: {
          type: 'object',
          required: ['label', 'description', 'type', 'amount', 'date'],
          properties: {
            label: { type: 'string', example: 'Courses' },
            description: { type: 'string', example: 'Supermarché du coin' },
            type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
            amount: { type: 'number', example: 42.5 },
            date: { type: 'string', format: 'date', example: '2026-10-07' },
          },
        },
        Transaction: {
          allOf: [
            { $ref: '#/components/schemas/TransactionInput' },
            {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '66f1c2a4e1b2c3d4e5f60718' },
                ownerId: { type: 'string', example: '66f1c2a4e1b2c3d4e5f60719' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          ],
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'INVALID_INPUT' },
                message: { type: 'string', example: "L'email est invalide" },
              },
            },
          },
        },
        NotFound: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Transaction introuvable' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Token absent, invalide ou expiré',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: { code: 'UNAUTHORIZED', message: 'Authentification requise' } },
            },
          },
        },
        NotFound: {
          description: "La transaction n'existe pas ou n'appartient pas à l'utilisateur",
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NotFound' },
            },
          },
        },
      },
    },
  },
  // Chemins absolus : fonctionne que le serveur soit lancé depuis la racine ou depuis backend/
  apis: [`${currentDir}/../app.js`, `${currentDir}/../routes/*.js`],
};

export const swaggerSpec = swaggerJsdoc(options);
