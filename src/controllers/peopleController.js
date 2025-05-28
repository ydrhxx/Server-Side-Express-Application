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
        message: 'Person not found'
      });
    }

    // Return the person info
    res.status(200).json(person);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
};
