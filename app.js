const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');

const app = express();
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/urlshortener');

// Schema & Model
const UrlSchema = new mongoose.Schema({
  original: String,
  short: String,
});
const Url = mongoose.model('Url', UrlSchema);

// Frontend
app.get('/', async (req, res) => {
  const urls = await Url.find().sort({ _id: -1 });
  const urlList = urls.map(u =>
    `<li>${u.original} → <a href="/${u.short}" target="_blank">${req.protocol}://${req.get('host')}/${u.short}</a>
    <button onclick="copyURL('${u.short}')">Copy</button></li>`
  ).join('');

  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>URL Shortener</title>
    <style>
      body {
        margin: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, #6a11cb, #2575fc);
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      header {
        text-align: center;
        margin: 40px 20px 20px 20px;
      }
      header h1 {
        font-size: 32px;
        margin-bottom: 10px;
      }
      header p {
        font-size: 16px;
        opacity: 0.9;
      }
      .buttons {
        display: flex;
        gap: 15px;
        justify-content: center;
        margin: 20px 0;
      }
      .buttons button {
        padding: 10px 20px;
        border: none;
        border-radius: 25px;
        font-size: 14px;
        cursor: pointer;
        transition: 0.3s;
        background: rgba(255,255,255,0.15);
        color: white;
      }
      .buttons button:hover {
        background: rgba(255,255,255,0.3);
      }
      .container {
        background: white;
        color: #333;
        border-radius: 12px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        padding: 30px;
        max-width: 600px;
        width: 90%;
        text-align: center;
      }
      .container h2 {
        margin-bottom: 20px;
        font-size: 20px;
      }
      input {
        width: 75%;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid #ccc;
        font-size: 14px;
      }
      button.shorten {
        padding: 12px 20px;
        border: none;
        border-radius: 8px;
        background: linear-gradient(90deg,#4facfe,#00f2fe);
        color: white;
        cursor: pointer;
        font-size: 14px;
        margin-left: 10px;
      }
      button.shorten:hover {
        opacity: 0.9;
      }
      #result {
        margin-top: 15px;
        font-weight: bold;
        color: #6a11cb;
      }
      ul {
        list-style: none;
        padding: 0;
        margin-top: 20px;
      }
      li {
        background: #f9f9f9;
        padding: 12px;
        margin-bottom: 10px;
        border-radius: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
      }
      li a {
        color: #2575fc;
        text-decoration: none;
        font-weight: bold;
      }
      li button {
        padding: 6px 12px;
        font-size: 13px;
        border: none;
        border-radius: 6px;
        background: #6a11cb;
        color: white;
        cursor: pointer;
      }
      li button:hover {
        opacity: 0.8;
      }
    </style>
  </head>
  <body>
    <header>
      <h1>🔗 URL Shortener</h1>
      <p>Create short, memorable links with detailed analytics</p>
      <div class="buttons">
        <button>Create Short URL</button>
        <button>Manage URLs</button>
        <button>Analytics</button>
      </div>
    </header>

    <div class="container">
      <h2>Create Short URL</h2>
      <input type="text" id="urlInput" placeholder="https://example.com/very-long-url">
      <button class="shorten" onclick="shorten()">Shorten</button>
      <div id="result"></div>
      <ul id="urlList">
        ${urlList}
      </ul>
    </div>

    <script>
      async function shorten() {
        const url = document.getElementById('urlInput').value;
        if(!url) return alert('Please enter a URL');
        const res = await fetch('/shorten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ original: url })
        });
        const data = await res.json();
        if(data.error) document.getElementById('result').innerText = data.error;
        else {
          const newItem = document.createElement('li');
          newItem.innerHTML = \`\${data.original} → <a href="/\${data.short}" target="_blank">\${location.origin}/\${data.short}</a>
          <button onclick="copyURL('\${data.short}')">Copy</button>\`;
          document.getElementById('urlList').prepend(newItem);
          document.getElementById('urlInput').value = '';
          document.getElementById('result').innerText = '✅ Short URL created!';
        }
      }

      function copyURL(short) {
        const fullURL = location.origin + '/' + short;
        navigator.clipboard.writeText(fullURL).then(() => alert('Copied to clipboard!'));
      }
    </script>
  </body>
  </html>
  `);
});

// API to create short URL
app.post('/shorten', async (req, res) => {
  const { original } = req.body;
  if (!original) return res.status(400).json({ error: 'URL required' });
  const short = shortid.generate();
  await Url.create({ original, short });
  res.json({ original, short });
});

// Redirect short URL
app.get('/:short', async (req, res) => {
  const url = await Url.findOne({ short: req.params.short });
  if (url) return res.redirect(url.original);
  res.status(404).send('URL not found');
});

// Start server
app.listen(5000, () => console.log('✅ Server running at http://localhost:5000'));
