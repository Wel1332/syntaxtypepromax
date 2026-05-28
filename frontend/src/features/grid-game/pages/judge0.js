import axios from "axios";

// Judge0 CE RapidAPI endpoint
const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com/submissions";

// Your RapidAPI credentials
const RAPIDAPI_HOST = "judge0-ce.p.rapidapi.com";
const RAPIDAPI_KEY = "59d1b3d17fmsh86f863c96541ddcp19de3cjsnfa4c4a2f3419";

// Base64 decoding helper
function decodeBase64(str) {
  if (!str) return "";
  return decodeURIComponent(escape(atob(str)));
}

export async function runCCode(source_code) {
  try {
    const base64Code = btoa(unescape(encodeURIComponent(source_code)));

    // Step 1: Submit code
    const { data: submission } = await axios.post(
      `${JUDGE0_URL}?base64_encoded=true&wait=false`,
      {
        source_code: base64Code,
        language_id: 50, // 50 = C (gcc)
        stdin: "",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-rapidapi-host": RAPIDAPI_HOST,
          "x-rapidapi-key": RAPIDAPI_KEY,
        },
      }
    );

    const token = submission.token;

    // Step 2: Poll for result
    let result;
    while (true) {
      const { data } = await axios.get(
        `${JUDGE0_URL}/${token}?base64_encoded=true`,
        {
          headers: {
            Accept: "application/json",
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY,
          },
        }
      );

      if (data.status?.id <= 2) {
        // Still processing (1: In Queue, 2: Processing)
        await new Promise((res) => setTimeout(res, 1000));
        continue;
      }

      result = data;
      break;
    }

    return {
      stdout: decodeBase64(result.stdout),
      stderr: decodeBase64(result.stderr),
      compile_output: decodeBase64(result.compile_output),
      status: result.status?.description,
    };
  } catch (err) {
    console.error("Judge0 RapidAPI error:", err.response?.data || err.message);
    return { error: "Execution failed" };
  }
}
