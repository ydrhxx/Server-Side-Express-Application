const knex = require('../db/knex'); // Import database connection

// GET /people/:id
exports.getPerson = async (req, res) => {
  const { id } = req.params;

  // Reject any requests that include query parameters
  if (Object.keys(req.query).length > 0) {
    return res.status(400).json({
      error: true,
      message: 'Query parameters are not permitted.'
    });
  }

  try {
    // Fetch person details by ID from the 'names' table
    const person = await knex('names')
      .select('nconst as id',
        'primaryName as name',
        'birthYear',
        'deathYear',
        'primaryProfession as profession'
      )
      .where({ nconst: id })
      .first();

    // Return 404 if the person doesn't exist
    if (!person) {
      return res.status(404).json({ error: true, message: 'Person not found' });
    }

    // Convert profession string to array 
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
    
    // Check if the 'characters' table exists
    let charactersTableExists = true;
    try {
      await knex('characters').count('*');
    } catch (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') {
        charactersTableExists = false;
      } else {
        throw err; // rethrow if it's a different error
      }
    }

    // Loop through each role and add characters if the table exists
    for (const role of roles) {
      // Convert rating to float if not null
      role.imdbRating = role.imdbRating !== null ? parseFloat(role.imdbRating) : null;

      if (charactersTableExists) {
        // Get characters from 'characters' table for this movie/person pair
        const charRow = await knex('characters')
          .select('name')
          .where({ tconst: role.movieId, nconst: id });

        // Format characters as array of strings
        role.characters = charRow.map(c => c.name);
      } else {
        role.characters = [];
      }
    }

    // Attach all roles to the person object
    person.roles = roles;

    // Respond with person data including roles and characters
    res.status(200).json(person);
  } catch (err) {
    console.error('Error in getPerson:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch person' });
  }
};
