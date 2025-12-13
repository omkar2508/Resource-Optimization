import axios from "axios";

export async function callPythonScheduler(payload) {
  try {
    const response = await axios.post("http://127.0.0.1:6000/generate", payload, {
      timeout: 20000,
    });

    return response.data;
  } catch (err) {
    console.error("Scheduler API Error:", err.message);
    throw new Error("Scheduler API Not Responding");
  }
}
