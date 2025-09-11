// fetchLanguages.js
require("dotenv").config();
const axios = require("axios");
const fs = require("fs");

const JUDGE0 = process.env.JUDGE0_API_URL || "https://judge0-extra-ce.p.rapidapi.com";
const RAPID_KEY = process.env.JUDGE0_RAPIDAPI_KEY;
const RAPID_HOST = process.env.JUDGE0_RAPIDAPI_HOST;

async function fetchLanguages() {
  try {
    const headers = {
      "X-RapidAPI-Key": RAPID_KEY,
      "X-RapidAPI-Host": RAPID_HOST,
    };

    const resp = await axios.get(`${JUDGE0}/languages`, { headers });

    console.log("✅ Languages fetched:", resp.data.length);
    fs.writeFileSync("languages.json", JSON.stringify(resp.data, null, 2));
    console.log("✅ Saved to languages.json");
  } catch (err) {
    console.error("❌ Failed to fetch languages:", err.response?.data || err.message);
  }
}

fetchLanguages();
