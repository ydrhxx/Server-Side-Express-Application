const knex = require('../db/knex');

exports.getPerson = async (req, res) => {
  const { id } = req.params;

  if (Object.keys(req.query).length > 0) {
    return res.status(400).json({
      error: true,
      message: 'Query parameters are not permitted.'
    });
  }

  try {
    const person = await knex('names')
      .select('nconst as id', 'primaryName as name', 'birthYear', 'deathYear', 'primaryProfession as profession')
      .where({ nconst: id })
      .first();

    if (!person) {
      return res.status(404).json({ error: true, message: 'Person not found' });
    }

    person.profession = person.profession ? person.profession.split(',') : [];

    // Get roles
    const roles = await knex('principals')
      .join('basics', 'principals.tconst', 'basics.tconst')
      .select(
        'principals.tconst as movieId',
        'basics.primaryTitle as movieName',
        'principals.category',
        'basics.imdbRating'
      )
      .where('principals.nconst', id);

    let charactersTableExists = true;
    try {
      await knex('characters').count('*');
    } catch (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') {
        charactersTableExists = false;
      } else {
        throw err;
      }
    }

    for (const role of roles) {
      role.imdbRating = role.imdbRating !== null ? parseFloat(role.imdbRating) : null;

      if (charactersTableExists) {
        const charRow = await knex('characters')
          .select('name')
          .where({ tconst: role.movieId, nconst: id });

        role.characters = charRow.map(c => c.name);
      } else {
        role.characters = [];
      }
    }

    person.roles = roles;

    res.status(200).json(person);
  } catch (err) {
    console.error('Error in getPerson:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch person' });
  }
};
