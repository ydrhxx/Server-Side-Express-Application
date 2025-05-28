// src/controllers/moviesController.js
const knex = require('../db/knex');

exports.search = async (req, res) => {
  try {
    const { year, title, page = 1, perPage = 10 } = req.query;

    const parsedPage = parseInt(page, 10);
    const parsedPerPage = parseInt(perPage, 10);

    if (isNaN(parsedPage) || parsedPage < 1 || isNaN(parsedPerPage) || parsedPerPage < 1) {
      return res.status(400).json({ error: true, message: 'Invalid pagination values' });
    }

    let query = knex('basics')
      .join('ratings', 'basics.tconst', 'ratings.tconst')
      .select(
        'basics.tconst as imdbID',
        'basics.primaryTitle as title',
        'basics.year',
        'basics.runtimeMinutes',
        'basics.genres',
        knex.raw("CAST(REPLACE(ratings.imdbRating, '/10', '') AS DECIMAL(3,1)) as imdbRating"),
        knex.raw("CAST(REPLACE(ratings.rottenTomatoesRating, '%', '') AS UNSIGNED) as rottenTomatoesRating"),
        knex.raw("CAST(REPLACE(ratings.metacriticRating, '/100', '') AS UNSIGNED) as metacriticRating"),
        'basics.titleType as classification'
      );

    if (year) query = query.where('basics.year', year);
    if (title) query = query.where('basics.primaryTitle', 'like', `%${title}%`);

    const totalResult = await query.clone().count('* as count').first();
    const total = Number(totalResult.count);
    const lastPage = Math.ceil(total / parsedPerPage);

    const movies = await query
      .limit(parsedPerPage)
      .offset((parsedPage - 1) * parsedPerPage);

    const pagination = {
      total,
      lastPage,
      prevPage: parsedPage > 1 ? parsedPage - 1 : null,
      nextPage: parsedPage < lastPage ? parsedPage + 1 : null,
      perPage: parsedPerPage,
      currentPage: parsedPage,
      from: (parsedPage - 1) * parsedPerPage,
      to: (parsedPage - 1) * parsedPerPage + movies.length
    };

    res.status(200).json({
      data: movies,
      pagination
    });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
};
