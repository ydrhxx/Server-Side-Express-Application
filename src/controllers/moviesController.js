const knex = require('../db/knex');

// GET /movies/search
exports.searchMovies = async (req, res) => {
  try {
    const { title, year, page = 1, limit = 100 } = req.query;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    if (isNaN(parsedPage) || parsedPage < 1) {
      return res.status(400).json({ message: 'Invalid page format. page must be a number.' });
    }

    if (year && isNaN(parseInt(year))) {
      return res.status(400).json({ message: 'Invalid year format. Format must be yyyy.' });
    }

    const offset = (parsedPage - 1) * parsedLimit;

    const baseQuery = knex('basics')
      .select(
        'tconst as imdbID',
        'primaryTitle as title',
        'year',
        'runtimeMinutes as runtime',
        'genres',
        'imdbRating',
        'rottenTomatoesRating',
        'metacriticRating',
        'rated as classification'
      )
      .whereNotNull('tconst');

    if (title) {
      baseQuery.andWhere('primaryTitle', 'like', `%${title}%`);
    }

    if (year) {
      baseQuery.andWhere('year', parseInt(year, 10));
    }

    const dataQuery = baseQuery.clone().limit(parsedLimit).offset(offset);
    const countQuery = baseQuery.clone().clearSelect().count('* as count').first();

    const [data, countResult] = await Promise.all([dataQuery, countQuery]);
    const total = parseInt(countResult.count, 10);

    res.status(200).json({
      data,
      pagination: {
        total,
        lastPage: Math.ceil(total / parsedLimit),
        prevPage: parsedPage > 1 ? parsedPage - 1 : null,
        nextPage: parsedPage * parsedLimit < total ? parsedPage + 1 : null,
        perPage: parsedLimit,
        currentPage: parsedPage,
        from: offset,
        to: offset + data.length
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

    const movie = await knex('basics')
      .select(
        'tconst as imdbID',
        'primaryTitle as title',
        'year',
        'runtimeMinutes as runtime',
        'genres',
        'plot',
        'poster',
        'imdbRating',
        'rottenTomatoesRating',
        'metacriticRating',
        'rated as classification'
      )
      .where('tconst', imdbID)
      .first();

    if (!movie) {
      return res.status(404).json({ error: true, message: 'Movie not found' });
    }

    res.status(200).json(movie);
  } catch (err) {
    console.error('Error in getMovieById:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch movie' });
  }
};
