module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Cab230!',
      database: process.env.DB_NAME || 'moviesdb'
    },
    migrations: {
      directory: './migrations'
    }
  }
};
