require('dotenv').config();
const express = require('express');
const winston = require('winston');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

/* ---------------- LOGGER ---------------- */
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'server.log' })
  ]
});

/* ---------------- SUPABASE (ENV VARIABLES) ---------------- */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

/* ---------------- HEALTH CHECK ---------------- */
app.get('/', (req, res) => {
  res.send('🚀 Server is running');
});

/* ---------------- ROUTE 1: GENERATE ERROR ---------------- */
app.get('/error', async (req, res) => {
  try {
    const errorLog = {
      service_name: "payment-service",
      error_message: "Database connection failed",
      error_code: "ECONNREFUSED",
      timestamp: new Date(),
      status: "ERROR",
      analyzed: false,
      retry_count: 0
    };

    // Log to file
    logger.error(errorLog);

    // Store in Supabase
    const { error } = await supabase
      .from('projectlogs')
      .insert([errorLog]);

    if (error) {
      console.error("Supabase Error:", error.message);
      return res.status(500).send(`Supabase insert error: ${error.message}`);
    }

    res.send("✅ Error logged to file and Supabase!");
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

/* ---------------- ROUTE 2: RETRY / RECOVERY ---------------- */
app.post('/retry', async (req, res) => {
  try {
    const { service, error, action } = req.body;

    console.log("🔄 Recovery triggered:");
    console.log("Service:", service);
    console.log("Error:", error);
    console.log("Action:", action);

    let recoveryStatus = "SUCCESS";

    // Flexible action handling
    if (action && action.toLowerCase().includes("retry")) {
      console.log("🔁 Retrying operation...");
    } 
    else if (action && action.toLowerCase().includes("restart")) {
      console.log("🔄 Restarting service...");
    } 
    else {
      console.log("⚠️ Unknown action, manual check required");
      recoveryStatus = "FAILED";
    }

    res.json({
      status: recoveryStatus,
      message: "Recovery action executed",
      service: service
    });

  } catch (err) {
    console.error("Recovery Error:", err);
    res.status(500).json({
      status: "FAILED",
      message: "Recovery failed due to server error"
    });
  }
});

/* ---------------- ROUTE 3: GET LOGS ---------------- */
app.get('/logs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projectlogs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error("Fetch Error:", error.message);
      return res.status(500).send(error.message);
    }

    res.json(data);
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

/* ---------------- START SERVER (RAILWAY COMPATIBLE) ---------------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});