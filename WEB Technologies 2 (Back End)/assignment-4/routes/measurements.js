const express = require('express');
const router = express.Router();
const Measurement = require('../models/Measurement');

/**
 * GET /api/measurements
 * Retrieve time-series data filtered by date range and field
 * Query parameters:
 *   - field: field name (field1, field2, or field3)
 *   - start_date: start date in YYYY-MM-DD format
 *   - end_date: end date in YYYY-MM-DD format
 */
router.get('/', async (req, res) => {
  try {
    const { field, start_date, end_date } = req.query;

    // Validation
    if (!field) {
      return res.status(400).json({ error: 'Field parameter is required' });
    }

    if (!['field1', 'field2', 'field3'].includes(field)) {
      return res.status(400).json({ error: 'Invalid field name. Must be field1, field2, or field3' });
    }

    // Build query
    const query = {};

    if (start_date || end_date) {
      query.timestamp = {};

      if (start_date) {
        const startDate = new Date(start_date);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ error: 'Invalid start_date format. Use YYYY-MM-DD' });
        }
        query.timestamp.$gte = startDate;
      }

      if (end_date) {
        const endDate = new Date(end_date);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({ error: 'Invalid end_date format. Use YYYY-MM-DD' });
        }
        // Set to end of day
        endDate.setHours(23, 59, 59, 999);
        query.timestamp.$lte = endDate;
      }
    }

    // Fetch data from MongoDB
    const measurements = await Measurement.find(query)
      .select(`timestamp ${field} -_id`)
      .sort({ timestamp: 1 })
      .lean();

    if (measurements.length === 0) {
      return res.status(404).json({
        error: 'No data found for the specified criteria',
        query: { field, start_date, end_date }
      });
    }

    // Format response
    const formattedData = measurements.map(item => ({
      timestamp: item.timestamp.toISOString(),
      [field]: item[field]
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching measurements:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/measurements/metrics
 * Calculate and return statistical metrics for a specific field
 * Query parameters:
 *   - field: field name (field1, field2, or field3)
 *   - start_date: optional start date in YYYY-MM-DD format
 *   - end_date: optional end date in YYYY-MM-DD format
 */
router.get('/metrics', async (req, res) => {
  try {
    const { field, start_date, end_date } = req.query;

    // Validation
    if (!field) {
      return res.status(400).json({ error: 'Field parameter is required' });
    }

    if (!['field1', 'field2', 'field3'].includes(field)) {
      return res.status(400).json({ error: 'Invalid field name. Must be field1, field2, or field3' });
    }

    // Build query
    const matchQuery = {};

    if (start_date || end_date) {
      matchQuery.timestamp = {};

      if (start_date) {
        const startDate = new Date(start_date);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ error: 'Invalid start_date format. Use YYYY-MM-DD' });
        }
        matchQuery.timestamp.$gte = startDate;
      }

      if (end_date) {
        const endDate = new Date(end_date);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({ error: 'Invalid end_date format. Use YYYY-MM-DD' });
        }
        // Set to end of day
        endDate.setHours(23, 59, 59, 999);
        matchQuery.timestamp.$lte = endDate;
      }
    }

    // Use MongoDB aggregation pipeline for efficient calculation
    const result = await Measurement.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          avg: { $avg: `$${field}` },
          min: { $min: `$${field}` },
          max: { $max: `$${field}` },
          stdDevPop: { $stdDevPop: `$${field}` },
          count: { $sum: 1 },
          values: { $push: `$${field}` }
        }
      }
    ]);

    if (!result || result.length === 0) {
      return res.status(404).json({
        error: 'No data found for the specified criteria',
        query: { field, start_date, end_date }
      });
    }

    const stats = result[0];

    // Format response with rounded values
    const metrics = {
      field: field,
      count: stats.count,
      avg: parseFloat(stats.avg.toFixed(2)),
      min: parseFloat(stats.min.toFixed(2)),
      max: parseFloat(stats.max.toFixed(2)),
      stdDev: parseFloat(stats.stdDevPop.toFixed(2)),
      range: parseFloat((stats.max - stats.min).toFixed(2))
    };

    // Add date range to response if provided
    if (start_date || end_date) {
      metrics.dateRange = {
        start: start_date || 'N/A',
        end: end_date || 'N/A'
      };
    }

    res.json(metrics);
  } catch (error) {
    console.error('Error calculating metrics:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/measurements/all-fields
 * Get data for all fields in a specific date range
 * Query parameters:
 *   - start_date: start date in YYYY-MM-DD format
 *   - end_date: end date in YYYY-MM-DD format
 */
router.get('/all-fields', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Build query
    const query = {};

    if (start_date || end_date) {
      query.timestamp = {};

      if (start_date) {
        const startDate = new Date(start_date);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ error: 'Invalid start_date format. Use YYYY-MM-DD' });
        }
        query.timestamp.$gte = startDate;
      }

      if (end_date) {
        const endDate = new Date(end_date);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({ error: 'Invalid end_date format. Use YYYY-MM-DD' });
        }
        endDate.setHours(23, 59, 59, 999);
        query.timestamp.$lte = endDate;
      }
    }

    // Fetch data
    const measurements = await Measurement.find(query)
      .select('timestamp field1 field2 field3 -_id')
      .sort({ timestamp: 1 })
      .lean();

    if (measurements.length === 0) {
      return res.status(404).json({
        error: 'No data found for the specified criteria',
        query: { start_date, end_date }
      });
    }

    // Format response
    const formattedData = measurements.map(item => ({
      timestamp: item.timestamp.toISOString(),
      field1: item.field1,
      field2: item.field2,
      field3: item.field3
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching all fields:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/measurements/date-range
 * Get the available date range in the database
 */
router.get('/date-range', async (req, res) => {
  try {
    const minDate = await Measurement.findOne().sort({ timestamp: 1 }).select('timestamp -_id').lean();
    const maxDate = await Measurement.findOne().sort({ timestamp: -1 }).select('timestamp -_id').lean();

    if (!minDate || !maxDate) {
      return res.status(404).json({ error: 'No data available in the database' });
    }

    res.json({
      minDate: minDate.timestamp.toISOString().split('T')[0],
      maxDate: maxDate.timestamp.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error fetching date range:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
