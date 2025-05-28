const express = require('express');
const router = express.Router();
const peopleController = require('../controllers/peopleController');
const authenticateJWT = require('../middleware/auth');
const knex = require('../db/knex');

// GET /people/:id
router.get('/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;

  // Block query params from being passed to /people route
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

    // Format profession
    if (person.profession) {
      person.profession = person.profession.split(',');
    }

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

    // Get characters (skip if table doesn't exist)
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
    console.error('Error in GET /people/:id', err);
    res.status(500).json({ error: true, message: 'Failed to fetch person' });
  }
});

module.exports = router;
