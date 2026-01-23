import axios from "axios";

export async function callPythonScheduler(payload) {
  try {
    const response = await axios.post(
      `${process.env.PYTHON_API_URL}/generate`,
      payload,
      { timeout: 200000 }
    );

    return response.data;

  } catch (err) {
    console.error("PYTHON FULL ERROR: ");
    console.error(err.response?.data || err.message);
    throw err;
  }
}
