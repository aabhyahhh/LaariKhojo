// migrationScripts/migrateDays.js
require("dotenv").config({ path: require('path').resolve(__dirname, '../.env') }); // Correctly locate the .env file
const mongoose = require("mongoose");
const User = require("../models/userModel");

const MONGO_URI = process.env.MONGO_URI;

const dayNameToNumber = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

// Function to clean up and format time string
const formatTime = (timeStr) => {
    if (typeof timeStr !== 'string') return timeStr;
    return timeStr.trim().toUpperCase().replace(/\s+/g, ' ');
};

// Function to convert 12-hour (AM/PM) time string to 24-hour format
function convertTo24Hour(timeStr) {
  if (typeof timeStr !== 'string') return timeStr;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return timeStr; // Already 24-hour or invalid, return as is
  let [_, hour, minute, period] = match;
  hour = parseInt(hour, 10);
  if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
  return `${hour.toString().padStart(2, "0")}:${minute}`;
}

const migrateVendorData = async () => {
  if (!MONGO_URI) {
    console.error("MONGO_URI not found in .env file. Please add it.");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("App connected to database for migration.");

    const vendorsToMigrate = await User.find({
      $or: [
        { "operatingHours.days": { $type: "string" } },
        { "operatingHours.openTime": { $not: /^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/i } },
        { "operatingHours.closeTime": { $not: /^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/i } }
      ]
    }).lean(); // Use .lean() for faster, non-Mongoose documents

    if (vendorsToMigrate.length === 0) {
      console.log("No vendors with invalid days or time formats found. Nothing to migrate.");
      return;
    }

    console.log(`Found ${vendorsToMigrate.length} vendors to check for migration.`);
    let migratedCount = 0;
    
    const bulkOps = [];

    for (const vendor of vendorsToMigrate) {
      const updateFields = {};

      // Migrate days from string to number
      if (vendor.operatingHours && Array.isArray(vendor.operatingHours.days) && vendor.operatingHours.days.some(d => typeof d === 'string')) {
        const numericDays = vendor.operatingHours.days
          .map(day => (typeof day === 'string' ? dayNameToNumber[day.toLowerCase()] : day))
          .filter(day => typeof day === 'number');
        updateFields['operatingHours.days'] = [...new Set(numericDays)];
      }

      // Clean up and convert time formats
      if (vendor.operatingHours) {
        if (vendor.operatingHours.openTime) {
          updateFields['operatingHours.openTime'] = convertTo24Hour(vendor.operatingHours.openTime);
        }
        if (vendor.operatingHours.closeTime) {
          updateFields['operatingHours.closeTime'] = convertTo24Hour(vendor.operatingHours.closeTime);
        }
      }
      
      if (Object.keys(updateFields).length > 0) {
        bulkOps.push({
            updateOne: {
                filter: { _id: vendor._id },
                update: { $set: updateFields }
            }
        });
        migratedCount++;
      }
    }

    if (bulkOps.length > 0) {
        console.log(`Performing bulk update on ${bulkOps.length} vendors...`);
        await User.bulkWrite(bulkOps);
        console.log(`\nMigration complete. Successfully updated ${migratedCount} vendors.`);
    } else {
        console.log("No vendors required updates after checking.");
    }

  } catch (error) {
    console.error("Migration script failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
};

migrateVendorData(); 