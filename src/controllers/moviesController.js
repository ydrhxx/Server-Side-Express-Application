const knex = require('../db/knex'); // Import database connection

// GET /movies/search
exports.searchMovies = async (req, res) => {
  try {
    // Extract query parameters (with defaults for page and limit)
    const { title, year, page = 1, limit = 100 } = req.query;
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    // Validate page and limit values
    if (isNaN(parsedPage)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid page format. page must be a number.'
      });
    }

    if (isNaN(parsedLimit)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid limit format. limit must be a number.'
      });
    }

    // Validate year format (yyyy)
    if (year && (!/^\d{4}$/.test(year))) {
      return res.status(400).json({
        error: true,
        message: 'Invalid year format. Format must be yyyy.'
      });
    }

    const offset = (parsedPage - 1) * parsedLimit;

    // Base query for selecting movies
    const baseQuery = knex('basics')
      .select(
        'tconst as imdbID',
        'primaryTitle as title',
        'year',
        'imdbRating',
        'rottenTomatoesRating',
        'metacriticRating',
        'rated as classification'
      )
      .whereNotNull('tconst');
    
    // Add title filter if provided
    if (title) {
      baseQuery.where('primaryTitle', 'like', `%${title}%`);
    }

    // Add year filter if provided
    if (year) {
      baseQuery.andWhere('year', parseInt(year, 10));
    }

    // Paginate data
    const dataQuery = baseQuery.clone().limit(parsedLimit).offset(offset);

    // Count total results (without pagination)
    const countQuery = knex('basics')
      .whereNotNull('tconst');
    if (title) {
      countQuery.where('primaryTitle', 'like', `%${title}%`);
    }
    if (year) {
      countQuery.andWhere('year', parseInt(year, 10));
    }

    const [{ count }] = await countQuery.clone().count('* as count');
    const total = parseInt(count, 10);
    const data = await dataQuery;

    // Format rating values into numbers
    const formattedData = data.map(movie => ({
      ...movie,
      imdbRating: movie.imdbRating !== null ? Number(movie.imdbRating) : null,
      rottenTomatoesRating: movie.rottenTomatoesRating !== null ? Number(movie.rottenTomatoesRating) : null,
      metacriticRating: movie.metacriticRating !== null ? Number(movie.metacriticRating) : null
    }));

    // Respond with paginated movie results
    res.status(200).json({
      data: formattedData,
      pagination: {
        total,
        lastPage: Math.ceil(total / parsedLimit),
        prevPage: parsedPage > 1 ? parsedPage - 1 : null,
        nextPage: parsedPage * parsedLimit < total ? parsedPage + 1 : null,
        perPage: parsedLimit,
        currentPage: parsedPage,
        from: offset,
        to: offset + formattedData.length
      }
    });
  } catch (error) {
    console.error('Error in searchMovies:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch movies'
    });
  }
};

// GET /movies/data/:imdbID
exports.getMovieById = async (req, res) => {
  try {
    const { imdbID } = req.params;

    // Reject if any query parameters are provided
    if (Object.keys(req.query).length > 0) {
      return res.status(400).json({
        error: true,
        message: 'Query parameters are not permitted.'
      });
    }

    // Fetch movie details from basics table
    const movie = await knex('basics')
      .select(
        'tconst as imdbID',
        'primaryTitle as title',
        'year',
        'imdbRating',
        'rottenTomatoesRating',
        'metacriticRating',
        'rated as classification',
        'genres',
        'plot',
        'poster',
        'runtimeMinutes as runtime',
        'boxoffice'
      )
      .where('tconst', imdbID)
      .first();

    if (!movie) {
      return res.status(404).json({ error: true, message: 'Movie not found' });
    }

    // Format and parse fields
    movie.imdbRating = movie.imdbRating !== null ? Number(movie.imdbRating) : null;
    movie.rottenTomatoesRating = movie.rottenTomatoesRating !== null ? Number(movie.rottenTomatoesRating) : null;
    movie.metacriticRating = movie.metacriticRating !== null ? Number(movie.metacriticRating) : null;
    movie.genres = movie.genres ? movie.genres.split(',') : [];

    // Fetch associated people (principals)
    const principals = await knex('principals')
      .select(
        'principals.nconst as id',
        'principals.category',
        'principals.job',
        'principals.characters',
        'names.primaryName as name'
      )
      .leftJoin('names', 'principals.nconst', 'names.nconst')
      .where('principals.tconst', imdbID)
      .limit(10);

    // Format people
    movie.principals = principals.map(p => ({
      id: p.id,
      category: p.category,
      job: p.job,
      characters: p.characters ? JSON.parse(p.characters) : [],
      name: p.name
    }));

    // Aggregate ratings in a structured array
    movie.ratings = [
      { source: 'Internet Movie Database', value: movie.imdbRating },
      { source: 'Rotten Tomatoes', value: movie.rottenTomatoesRating },
      { source: 'Metacritic', value: movie.metacriticRating }
    ].filter(r => r.value !== null);

    res.status(200).json(movie);
  } catch (err) {
    console.error('Error in getMovieById:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch movie' });
  }
};
