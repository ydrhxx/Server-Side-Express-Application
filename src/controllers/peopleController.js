const knex = require('../db/knex');

exports.getPerson = async (req, res) => {
  try {
    const personId = req.params.id;

    const person = await knex('names')
      .select(
        'nconst as id',
        'primaryName as name',
        'birthYear',
        'deathYear',
        'primaryProfession as profession'
      )
      .where('nconst', personId)
      .first();

    if (!person) {
      return res.status(404).json({
        error: true,
        message: 'Person not found',
      });
    }

    // Ensure `null` fields are returned as `null` instead of `undefined`
    const response = {
      id: person.id || null,
      name: person.name || null,
      birthYear: person.birthYear || null,
      deathYear: person.deathYear || null,
      profession: person.profession || null,
    };

    res.status(200).json(response);
  } catch (err) {
    console.error('Error in getPerson:', err);
    res.status(500).json({
      error: true,
      message: err.message,
    });
  }
};
