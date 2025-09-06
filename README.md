# 🔗 URL Shortener

A simple URL shortener built with **Node.js**, **Express**, and **MongoDB**.  
It lets you shorten long URLs, manage all your created URLs, and redirect using short links.

---

## 🚀 Features
- Create short URLs instantly  
- Copy short links with one click  
- Manage all your created URLs (listed on homepage)  
- Redirects short URLs to original URLs  
- Modern frontend with HTML + CSS  

---

## 🛠️ Tech Stack
- Node.js  
- Express.js  
- MongoDB (Mongoose ODM)  
- shortid (for generating unique short codes)  

---

## 📂 Project Structure
url-shortener/
│── app.js   

## Install dependencies:

```bash
npm install
```

## 📌 API Endpoints

### ➤ Create short URL
```http
POST /shorten
```
## Body (JSON):
```json
{
  "original": "https://example.com/very-long-url"
}
```
## Response:
```json
{
  "original": "https://example.com/very-long-url",
  "short": "abc123"
}

```
### ➤Redirect to original:
Example
```bash
http://localhost:5000/abc123
```
### 👉 Redirects to:
```bash
https://example.com/very-long-url
```




