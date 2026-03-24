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

/* ---------------- SUPABASE ---------------- */
const supabaseUrl = 'https://aotecjplcqwlupitibzg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvdGVjanBsY3F3bHVwaXRpYnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTM5NzgsImV4cCI6MjA4OTI4OTk3OH0.qJaPCak2e9yqa_kM9UqB1gSYc-lHv4_IE9rLw3u-Gio'; // ⚠️ Replace for safety
const supabase = createClient(supabaseUrl, supabaseKey);

/* ---------------- ROUTE 1: GENERATE ERROR ---------------- */
app.get('/error', async (req, res) => {
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
    return res.status(500).send(`Supabase insert error: ${error.message}`);
  }

  res.send("✅ Error logged to file and Supabase!");
});

/* ---------------- ROUTE 2: RETRY / RECOVERY ---------------- */
app.post('/retry', async (req, res) => {
  const { service, error, action } = req.body;

  console.log("🔄 Recovery triggered:");
  console.log("Service:", service);
  console.log("Error:", error);
  console.log("Action:", action);

  // Simulate recovery logic
  let recoveryStatus = "SUCCESS";

  // Example logic (you can expand later)
  if (action === "retry") {
    console.log("Retrying operation...");
  } else if (action === "restart-service") {
    console.log("Restarting service...");
  } else {
    console.log("Unknown action, manual check required");
    recoveryStatus = "FAILED";
  }

  res.json({
    status: recoveryStatus,
    message: "Recovery action executed",
    service: service
  });
});

/* ---------------- ROUTE 3: GET LOGS (for dashboard later) ---------------- */
app.get('/logs', async (req, res) => {
  const { data, error } = await supabase
    .from('projectlogs')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    return res.status(500).send(error.message);
  }

  res.json(data);
});

/* ---------------- START SERVER ---------------- */
// app.listen(3000, () => {
//   console.log("🚀 Server running on http://localhost:3000");
// });
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
 