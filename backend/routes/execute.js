const express = require("express");
const axios = require("axios");
const router = express.Router();

const JUDGE0 = process.env.JUDGE0_API_URL;
const RAPID_KEY = process.env.JUDGE0_RAPIDAPI_KEY;
const RAPID_HOST = process.env.JUDGE0_RAPIDAPI_HOST;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

router.post("/", async (req, res) => {
  try {
    const { language_id, source_code, stdin } = req.body;

    // Debug logging
    console.log("Judge0 URL:", JUDGE0);
    console.log("Using headers:", {
      "X-RapidAPI-Key": RAPID_KEY ? "[HIDDEN]" : undefined,
      "X-RapidAPI-Host": RAPID_HOST,
    });

    const headers = {
      "content-type": "application/json",
      "X-RapidAPI-Key": RAPID_KEY,
      "X-RapidAPI-Host": RAPID_HOST,
    };

    // 1. Create submission
    const createResp = await axios.post(
      `${JUDGE0}/submissions?base64_encoded=false&wait=false`,
      {
        language_id,
        source_code,
        stdin: stdin || "",
      },
      { headers }
    );

    const token = createResp.data.token;
    console.log("Created submission, token:", token);

    // 2. Poll for result
    let result = null;
    for (let i = 0; i < 30; i++) {
      await sleep(500);

      const rresp = await axios.get(`${JUDGE0}/submissions/${token}`, {
        headers,
      });

      if (rresp.data.status.id > 1) {
        result = rresp.data;
        break;
      }
    }

    if (!result) {
      return res.status(504).json({ error: "Execution timed out" });
    }

    res.json({
      token,
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      exit_code: result.exit_code,
      time: result.time,
      memory: result.memory,
      raw: result,
    });
  } catch (err) {
    console.error(
      "Execution error:",
      err.response?.data || err.message || err
    );
    res.status(500).json({
      error: "Execution failed",
      details: err.response?.data || err.message,
    });
  }
});

module.exports = router;
