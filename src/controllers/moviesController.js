const knex = require('../db/knex');

// GET /movies/search
exports.search = async (req, res) => {
  try {
    const { year, title, page = 1, perPage = 10 } = req.query;

    const safePage = Number(page) > 0 ? Number(page) : 1;
    const safePerPage = Number(perPage) > 0 ? Number(perPage) : 10;

    // Main query builder
    let query = knex('basics')
      .leftJoin('ratings', 'basics.tconst', 'ratings.tconst')
      .select(
        'basics.tconst as imdbID',
        'basics.primaryTitle as title',
        'basics.year',
        knex.raw(`MAX(CASE WHEN ratings.source = 'Internet Movie Database' THEN ratings.value END) as imdbRating`),
        knex.raw(`MAX(CASE WHEN ratings.source = 'Rotten Tomatoes' THEN ratings.value END) as rottenTomatoesRating`),
        knex.raw(`MAX(CASE WHEN ratings.source = 'Metacritic' THEN ratings.value END) as metacriticRating`),
        'basics.titleType as classification'
      );

    if (year) {
      if (!/^\d{4}$/.test(year)) {
        return res.status(400).json({ message: 'Invalid year format. Format must be yyyy.' });
      }
      query.where('basics.year', year);
    }

    if (title) {
      query.where('basics.primaryTitle', 'like', `%${title}%`);
    }

    query.groupBy(
      'basics.tconst',
      'basics.primaryTitle',
      'basics.year',
      'basics.titleType'
    );

    // Separate count query (safer than clone().count())
    const countQuery = knex('basics')
      .modify((qb) => {
        if (year) qb.where('basics.year', year);
        if (title) qb.where('basics.primaryTitle', 'like', `%${title}%`);
      })
      .countDistinct('basics.tconst as count')
      .first();

    const totalResult = await countQuery;
    const total = parseInt(totalResult?.count || 0);
    const lastPage = Math.ceil(total / safePerPage);

    const movies = await query
      .limit(safePerPage)
      .offset((safePage - 1) * safePerPage);

    res.status(200).json({
      data: movies,
      total,
      perPage: safePerPage,
      currentPage: safePage,
      lastPage,
      from: (safePage - 1) * safePerPage + 1,
      to: (safePage - 1) * safePerPage + movies.length
    });

  } catch (err) {
    console.error('[MOVIES/SEARCH ERROR]', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /movies/data/:imdbID
exports.getMovieById = async (req, res) => {
  try {
    const { imdbID } = req.params;

    const movie = await knex('basics')
      .leftJoin('ratings', 'basics.tconst', 'ratings.tconst')
      .select(
        'basics.tconst as imdbID',
        'basics.primaryTitle as title',
        'basics.year',
        'basics.runtimeMinutes',
        'basics.genres',
        knex.raw(`MAX(CASE WHEN ratings.source = 'Internet Movie Database' THEN ratings.value END) as imdbRating`),
        knex.raw(`MAX(CASE WHEN ratings.source = 'Rotten Tomatoes' THEN ratings.value END) as rottenTomatoesRating`),
        knex.raw(`MAX(CASE WHEN ratings.source = 'Metacritic' THEN ratings.value END) as metacriticRating`),
        'basics.titleType as classification'
      )
      .where('basics.tconst', imdbID)
      .groupBy(
        'basics.tconst',
        'basics.primaryTitle',
        'basics.year',
        'basics.runtimeMinutes',
        'basics.genres',
        'basics.titleType'
      )
      .first();

    if (!movie) {
      return res.status(404).json({ error: true, message: 'Movie not found' });
    }

    res.status(200).json(movie);
  } catch (err) {
    console.error('[MOVIES/GET ERROR]', err);
    res.status(500).json({ error: true, message: err.message });
  }
};
