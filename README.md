# 🥾 WalkBuddy

**WalkBuddy** is your AI-powered city walking companion 🗺️.
It helps users discover places, find walking paths, and navigate to destinations seamlessly — using **OpenStreetMap, Leaflet, and Foursquare API**.

---

## 🚀 Features

* 🌍 Interactive map with live location tracking
* 🔍 Search & add destinations with Foursquare API
* 🧭 Route calculation & walking directions
* 📍 Markers for visited & upcoming places
* ⚡ Backend API in Python (Flask/FastAPI)

## 🛠️ Tech Stack

* **Frontend**: ReactJS, TailwindCSS, Leaflet.js
* **Backend**: Python (Flask/FastAPI)
* **APIs & Maps**: Foursquare API, OpenStreetMap


## 📂 Project Structure

```
WalkBuddy/
│── frontend/      # React app
│── backend/       # Python backend
│── README.md      # Documentation
│── .env           # API keys
```

---

## 🔧 Installation & Setup

1. **Clone the repo**

```bash
git clone <your-repo-link>
cd WalkBuddy
```

2. **Setup Frontend**

```bash
cd frontend
npm install
npm run start
```

3. **Setup Backend**

```bash
cd backend
python -m uvicorn main:app --reload
```

4. **Environment Variables**
   Create a `.env` file with:

```
FOURSQUARE_API_KEY=your_api_key_here
```

5. **Run the app**

* Frontend → `http://localhost:3000`
* Backend → `http://localhost:5000`

---

## 📸 Demo Screenshot


<img width="1919" height="931" alt="Screenshot 2025-08-31 230515" src="https://github.com/user-attachments/assets/4792713d-eca0-434e-adc4-c4c0cbcc076c" />

---

## 🎯 Future Scope

* 🚶 Tourist mode → auto-suggest routes to popular attractions
* 🗣️ Multilingual support
* 🤖 AI-powered recommendations
