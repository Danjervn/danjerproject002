require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

app.post('/ai-chat', async (req, res) => {
  const { messages } = req.body;
  try {
    const result = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile", // Đổi model nếu muốn
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}` }
      }
    );
    res.json(result.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, () => {
  console.log("Server chạy tại http://localhost:4000");
});
