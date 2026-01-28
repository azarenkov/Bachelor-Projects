const mongoose = require("mongoose");
const config = require("./config");
const Measurement = require("./models/Measurement");

// Generate sample data
function generateSampleData(numDays = 30, recordsPerDay = 24) {
  const data = [];
  const now = new Date();

  // Generate data for the past 'numDays' days
  for (let day = numDays; day >= 0; day--) {
    for (let hour = 0; hour < recordsPerDay; hour++) {
      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - day);
      timestamp.setHours(hour, 0, 0, 0);

      // Generate realistic time-series data with trends and noise
      // field1: Temperature (°C) - range 18-30 with daily cycle
      const field1 =
        22 +
        Math.sin((hour / 24) * Math.PI * 2) * 4 +
        (Math.random() - 0.5) * 2;

      // field2: Humidity (%) - range 40-80 inverse to temperature
      const field2 =
        60 -
        Math.sin((hour / 24) * Math.PI * 2) * 10 +
        (Math.random() - 0.5) * 5;

      // field3: CO2 levels (ppm) - range 400-800 with some variation
      const field3 =
        500 +
        Math.sin((hour / 12) * Math.PI) * 100 +
        (Math.random() - 0.5) * 50;

      data.push({
        timestamp,
        field1: parseFloat(field1.toFixed(2)),
        field2: parseFloat(field2.toFixed(2)),
        field3: parseFloat(field3.toFixed(2)),
      });
    }
  }

  return data;
}

// Seed the database
async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...\n");

    // Connect to MongoDB
    await mongoose.connect(config.mongoURI);
    console.log("✓ Connected to MongoDB");

    // Clear existing data
    const deleteResult = await Measurement.deleteMany({});
    console.log(`✓ Cleared ${deleteResult.deletedCount} existing records`);

    // Generate and insert sample data
    console.log("\n📊 Generating sample data...");
    const sampleData = generateSampleData(30, 24); // 30 days, 24 records per day
    console.log(`✓ Generated ${sampleData.length} records`);

    console.log("\n💾 Inserting data into MongoDB...");
    const insertResult = await Measurement.insertMany(sampleData);
    console.log(`✓ Successfully inserted ${insertResult.length} records`);

    // Display statistics
    console.log("\n📈 Database Statistics:");
    const count = await Measurement.countDocuments();
    console.log(`   Total records: ${count}`);

    const oldestRecord = await Measurement.findOne()
      .sort({ timestamp: 1 })
      .lean();
    const newestRecord = await Measurement.findOne()
      .sort({ timestamp: -1 })
      .lean();

    if (oldestRecord && newestRecord) {
      console.log(
        `   Date range: ${oldestRecord.timestamp.toISOString().split("T")[0]} to ${newestRecord.timestamp.toISOString().split("T")[0]}`,
      );
    }

    // Calculate some sample statistics
    const stats = await Measurement.aggregate([
      {
        $group: {
          _id: null,
          avgField1: { $avg: "$field1" },
          avgField2: { $avg: "$field2" },
          avgField3: { $avg: "$field3" },
        },
      },
    ]);

    if (stats.length > 0) {
      console.log("\n📊 Average values:");
      console.log(
        `   field1 (Temperature): ${stats[0].avgField1.toFixed(2)}°C`,
      );
      console.log(`   field2 (Humidity): ${stats[0].avgField2.toFixed(2)}%`);
      console.log(`   field3 (CO2): ${stats[0].avgField3.toFixed(2)} ppm`);
    }

    console.log("\n✅ Database seeding completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Error seeding database:", error.message);
    console.error(error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("✓ MongoDB connection closed\n");
    process.exit(0);
  }
}

// Run the seed function
seedDatabase();
