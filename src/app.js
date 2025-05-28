const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/openapi.json');

const app = express();
app.use(express.json());

// === Mount API routes first ===
const testRoutes = require('./routes/test');
const moviesRoutes = require('./routes/movies');
const userRoutes = require('./routes/user');
const peopleRoutes = require('./routes/people');
app.use('/test', testRoutes);
app.use('/movies', moviesRoutes);
app.use('/user', userRoutes);
app.use('/people', peopleRoutes); 

// === Serve Swagger docs at root ===
app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = app;
