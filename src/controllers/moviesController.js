const knex = require('../db/knex');

// GET /movies/search
exports.search = async (req, res) => {
  try {
    const { year, title, page = 1, perPage = 10 } = req.query;

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
      query = query.where('basics.year', year);
    }

    if (title) {
      query = query.where('basics.primaryTitle', 'like', `%${title}%`);
    }

    query = query.groupBy(
      'basics.tconst',
      'basics.primaryTitle',
      'basics.year',
      'basics.titleType'
    );

    const totalResult = await query.clone().clearSelect().clearOrder()
      .count('* as count')
      .first();
    const total = parseInt(totalResult.count);

    const movies = await query.limit(perPage).offset((page - 1) * perPage);
    const lastPage = Math.ceil(total / perPage);

    res.status(200).json({
      data: movies,
      total,
      perPage: Number(perPage),
      currentPage: Number(page),
      lastPage,
      from: (page - 1) * perPage + 1,
      to: (page - 1) * perPage + movies.length
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
