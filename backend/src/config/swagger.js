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
          required: ['label', 'amount', 'type', 'date'],
          additionalProperties: false,
          properties: {
            label: { type: 'string', minLength: 1, maxLength: 120, example: 'Courses' },
            amount: { type: 'integer', minimum: 1, description: 'Montant en centimes (12345 = 123,45 €)', example: 12345 },
            type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
            date: { type: 'string', format: 'date', example: '2026-10-05' },
            description: { type: 'string', maxLength: 1000, description: 'Facultative', example: 'Supermarché du coin' },
          },
        },
        TransactionPatch: {
          type: 'object',
          minProperties: 1,
          additionalProperties: false,
          description: 'Au moins un champ, mêmes règles que TransactionInput',
          properties: {
            label: { type: 'string', minLength: 1, maxLength: 120 },
            amount: { type: 'integer', minimum: 1 },
            type: { type: 'string', enum: ['income', 'expense'] },
            date: { type: 'string', format: 'date' },
            description: { type: 'string', maxLength: 1000 },
          },
          example: { amount: 9900 },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439012' },
            label: { type: 'string', example: 'Courses' },
            amount: { type: 'integer', example: 12345 },
            type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
            date: { type: 'string', format: 'date', example: '2026-10-05' },
            description: { type: 'string', example: 'Supermarché du coin' },
            ownerId: { type: 'string', example: '66f1c2a4e1b2c3d4e5f60719' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
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
      },
      parameters: {
        TransactionId: {
          in: 'path',
          name: 'id',
          required: true,
          description: 'Identifiant MongoDB de la transaction (24 caractères hexadécimaux)',
          schema: { type: 'string', example: '507f1f77bcf86cd799439012' },
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
          description: "La transaction n'existe pas ou appartient à un autre utilisateur",
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: { code: 'NOT_FOUND', message: 'Transaction introuvable' } },
            },
          },
        },
        BadRequest: {
          description: 'Corps invalide, champ interdit (id, ownerId, inconnu) ou identifiant mal formé',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: { code: 'INVALID_INPUT', message: 'Le montant doit être un nombre entier de centimes strictement positif' } },
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
