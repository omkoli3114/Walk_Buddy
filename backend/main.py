from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

api_key = os.getenv("FOURSQUARE_API_KEY")
BASE_URL = "https://places-api.foursquare.com/places/search"

# FastAPI app
app = FastAPI(title="WalkBuddy Backend")

# Allow frontend (React) to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to frontend URL later for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "WalkBuddy Backend Running 🚀"}

@app.get("/search")
def search_places(
    query: str = Query(None, description="Search term like cafe, gym, etc."),
    ll: str = Query(None, description="Latitude,Longitude e.g. 41.8781,-87.6298"),
    radius: int = Query(1000, ge=0, le=100000, description="Search radius in meters"),
    fsq_category_ids: str = Query(None, description="Comma-separated category IDs"),
    min_price: int = Query(None, ge=1, le=4, description="Min price level"),
    max_price: int = Query(None, ge=1, le=4, description="Max price level"),
    open_now: bool = Query(None, description="Only return open places"),
    sort: str = Query("relevance", description="Sort by relevance, rating, or distance"),
    limit: int = Query(10, ge=1, le=50, description="Max results to return"),
):
    """
    Search nearby places using Foursquare Places API
    """
    headers = {
    "accept": "application/json",
    "X-Places-Api-Version": "2025-06-17",
    "authorization": f"Bearer {api_key}"
    }

    params = {
        "query": query,
        "ll": ll,
        "radius": radius,
        "fsq_category_ids": fsq_category_ids,
        "min_price": min_price,
        "max_price": max_price,
        "open_now": open_now,
        "sort": sort,
        "limit": limit,
    }

    # remove None values
    params = {k: v for k, v in params.items() if v is not None}

    try:
        response = requests.get(BASE_URL, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        print(json.dumps(data, indent=2))
        # Format the response
        formatted_results = []
        for place in data.get("results", []):
            formatted_results.append({
                "id": place.get("fsq_place_id"),  # correct key
                "name": place.get("name"),
                "categories": [c["name"] for c in place.get("categories", [])],
                "location": place.get("location", {}),
                "latitude": place.get("latitude"),   # <-- extract latitude
                "longitude": place.get("longitude"), # <-- extract longitude
                "distance": place.get("distance"),
                "price": place.get("price"),
                "rating": place.get("rating"),
                "tel": place.get("tel"),
                "website": place.get("website"),
            })


        return {"results": formatted_results, "count": len(formatted_results)}

    except requests.exceptions.RequestException as e:
        return {"error": str(e)}
