const knex = require('../db/knex');

// Helper: parse query parameters safely
function parseIntOrDefault(value, def) {
    const n = parseInt(value);
    return isNaN(n) ? def : n;
}

exports.search = async (req, res) => {
    try {
        // Get query params
        const { title, year, page } = req.query;
        const perPage = 100;
        const currentPage = parseIntOrDefault(page, 1);

        // Start building query
        let query = knex('movies');

        if (title) {
            query = query.where('title', 'like', `%${title}%`);
        }
        if (year) {
            query = query.where('year', parseIntOrDefault(year, null));
        }

        // Get total count (for pagination)
        const total = await query.clone().count('id as count').first();
        const totalMovies = total.count || 0;

        // Get results (pagination)
        const results = await query
            .offset((currentPage - 1) * perPage)
            .limit(perPage);

        // Format response as expected by your tests
        res.json({
            data: results,
            pagination: {
                total: Number(totalMovies),
                lastPage: Math.ceil(totalMovies / perPage),
                prevPage: currentPage > 1 ? currentPage - 1 : null,
                nextPage: currentPage * perPage < totalMovies ? currentPage + 1 : null,
                perPage,
                currentPage,
                from: (currentPage - 1) * perPage,
                to: (currentPage - 1) * perPage + results.length
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Server error' });
    }
};
