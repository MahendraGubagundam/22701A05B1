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
  visitCount: { type: Number, default: 0 },
  expiresAt: Date
});
const Url = mongoose.model('Url', UrlSchema);

// Frontend
app.get('/', async (req, res) => {
  const urls = await Url.find().sort({ _id: -1 });
  const urlList = urls.map(u =>
    `<li>
      ${u.original} → 
      <a href="/${u.short}" target="_blank">${req.protocol}://${req.get('host')}/${u.short}</a>
      <span>Visits: ${u.visitCount}</span>
      <span>Expires: ${u.expiresAt ? u.expiresAt.toLocaleString() : 'Never'}</span>
      <button onclick="copyURL('${u.short}')">Copy</button>
      <button onclick="deleteURL('${u._id}')">❌ Delete</button>
    </li>`
  ).join('');

  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>URL Shortener</title>
    <style>
      body { margin:0; font-family:sans-serif; background:linear-gradient(135deg,#6a11cb,#2575fc); color:white; display:flex; flex-direction:column; align-items:center; }
      header { text-align:center; margin:40px 20px 20px 20px; }
      .buttons { display:flex; gap:15px; justify-content:center; margin:20px 0; }
      .buttons button { padding:10px 20px; border:none; border-radius:25px; font-size:14px; cursor:pointer; background:rgba(255,255,255,0.15); color:white; }
      .container { background:white; color:#333; border-radius:12px; box-shadow:0 6px 20px rgba(0,0,0,0.2); padding:30px; max-width:650px; width:90%; text-align:center; }
      input, select { padding:12px; border-radius:8px; border:1px solid #ccc; font-size:14px; }
      input { width:60%; }
      select { width:30%; margin-left:5px; }
      button.shorten { padding:12px 20px; border:none; border-radius:8px; background:linear-gradient(90deg,#4facfe,#00f2fe); color:white; cursor:pointer; margin-left:10px; }
      ul { list-style:none; padding:0; margin-top:20px; }
      li { background:#f9f9f9; padding:12px; margin-bottom:10px; border-radius:8px; display:flex; flex-direction:column; align-items:flex-start; font-size:14px; gap:4px; }
      li a { color:#2575fc; font-weight:bold; text-decoration:none; }
      li button { padding:6px 12px; border:none; border-radius:6px; background:#6a11cb; color:white; cursor:pointer; margin-top:4px; }
      li button:hover { opacity:0.8; }
    </style>
  </head>
  <body>
    <header>
      <h1>🔗 URL Shortener</h1>
      <p>Create short, memorable links with expiry & analytics</p>
      <div class="buttons">
        <button onclick="showCreate()">Create Short URL</button>
        
      </div>
    </header>

    <div class="container" id="createBox">
      <h2>Create Short URL</h2>
      <input type="text" id="urlInput" placeholder="https://example.com/very-long-url">
      <select id="expiry">
        <option value="60">1 Hour</option>
        <option value="1440" selected>1 Day</option>
        <option value="10080">7 Days</option>
        <option value="">Never</option>
      </select>
      <button class="shorten" onclick="shorten()">Shorten</button>
      <div id="result"></div>
      <ul id="urlList">${urlList}</ul>
    </div>

    <script>
      async function shorten() {
        const url = document.getElementById('urlInput').value;
        const expiry = document.getElementById('expiry').value;
        if(!url) return alert('Please enter a URL');
        const res = await fetch('/shorten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ original: url, expireMinutes: expiry || null })
        });
        const data = await res.json();
        if(data.error) document.getElementById('result').innerText = data.error;
        else {
          const newItem = document.createElement('li');
          newItem.innerHTML = \`
            \${data.original} → <a href="/\${data.short}" target="_blank">\${location.origin}/\${data.short}</a>
            <span>Visits: 0</span>
            <span>Expires: \${data.expiresAt ? new Date(data.expiresAt).toLocaleString() : 'Never'}</span>
            <button onclick="copyURL('\${data.short}')">Copy</button>
            <button onclick="deleteURL('\${data._id}')">❌ Delete</button>\`;
          document.getElementById('urlList').prepend(newItem);
          document.getElementById('urlInput').value = '';
          document.getElementById('result').innerText = '✅ Short URL created!';
        }
      }

      function copyURL(short) {
        const fullURL = location.origin + '/' + short;
        navigator.clipboard.writeText(fullURL).then(() => alert('Copied to clipboard!'));
      }

      async function deleteURL(id) {
        if(!confirm('Are you sure you want to delete this URL?')) return;
        await fetch('/delete/' + id, { method: 'DELETE' });
        location.reload();
      }

      function showCreate() {
        document.getElementById('createBox').style.display = 'block';
      }
    </script>
  </body>
  </html>
  `);
});

// API to create short URL
app.post('/shorten', async (req, res) => {
  const { original, expireMinutes } = req.body;
  if (!original) return res.status(400).json({ error: 'URL required' });

  const short = shortid.generate();
  const expiresAt = expireMinutes ? new Date(Date.now() + expireMinutes * 60000) : null;

  const newUrl = await Url.create({ original, short, expiresAt });
  res.json({ _id: newUrl._id, original, short, expiresAt });
});

// Redirect short URL
app.get('/:short', async (req, res) => {
  const url = await Url.findOne({ short: req.params.short });
  if (!url) return res.status(404).send('❌ URL not found');
  if (url.expiresAt && url.expiresAt < new Date()) return res.status(410).send('⏰ URL expired');

  url.visitCount += 1;
  await url.save();
  res.redirect(url.original);
});


// Delete URL API
app.delete('/delete/:id', async (req, res) => {
  await Url.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Start server
app.listen(5000, () => console.log('✅ Server running at http://localhost:5000'));
