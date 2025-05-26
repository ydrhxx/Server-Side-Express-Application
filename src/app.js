const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/openapi.json');

const app = express();
app.use(express.json());

// Serve Swagger docs at root
app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const testRoutes = require('./routes/test');
app.use('/test', testRoutes);

module.exports = app;
