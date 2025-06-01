const express = require('express');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const swaggerDocument = require('./docs/openapi.json');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Force CORS headers for all responses
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// API Routes
const moviesRoutes = require('./routes/movies');
const userRoutes = require('./routes/user');
const peopleRoutes = require('./routes/people');

app.use('/movies', moviesRoutes);
app.use('/user', userRoutes);
app.use('/people', peopleRoutes);

// Serve Swagger UI only at '/'
app.get('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 404 for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Route not found'
  });
});

module.exports = app;
