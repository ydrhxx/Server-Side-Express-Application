const knex = require('../db/knex');

// GET /movies/search
exports.searchMovies = async (req, res) => {
  try {
    const { title, year, page = 1, limit = 100 } = req.query;
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

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

    if (year && (!/^\d{4}$/.test(year))) {
      return res.status(400).json({
        error: true,
        message: 'Invalid year format. Format must be yyyy.'
      });
    }

    const offset = (parsedPage - 1) * parsedLimit;

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

    if (title) {
      baseQuery.where('primaryTitle', 'like', `%${title}%`);
    }

    if (year) {
      baseQuery.andWhere('year', parseInt(year, 10));
    }

    const dataQuery = baseQuery.clone().limit(parsedLimit).offset(offset);

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

    const formattedData = data.map(movie => ({
      ...movie,
      imdbRating: movie.imdbRating !== null ? Number(movie.imdbRating) : null,
      rottenTomatoesRating: movie.rottenTomatoesRating !== null ? Number(movie.rottenTomatoesRating) : null,
      metacriticRating: movie.metacriticRating !== null ? Number(movie.metacriticRating) : null
    }));

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

    if (Object.keys(req.query).length > 0) {
      return res.status(400).json({
        error: true,
        message: 'Query parameters are not permitted.'
      });
    }

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

    movie.imdbRating = movie.imdbRating !== null ? Number(movie.imdbRating) : null;
    movie.rottenTomatoesRating = movie.rottenTomatoesRating !== null ? Number(movie.rottenTomatoesRating) : null;
    movie.metacriticRating = movie.metacriticRating !== null ? Number(movie.metacriticRating) : null;
    movie.genres = movie.genres ? movie.genres.split(',') : [];

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

    movie.principals = principals.map(p => ({
      id: p.id,
      category: p.category,
      job: p.job,
      characters: p.characters ? JSON.parse(p.characters) : [],
      name: p.name
    }));

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
