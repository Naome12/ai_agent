import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import app from '../app';

const specs = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'NCDA Trainings Management System API', version: '1.0.0' },
    servers: [{ url: process.env.API_BASE_URL || 'http://localhost:5000' }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));
