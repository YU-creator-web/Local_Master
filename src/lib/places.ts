const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const PLACES_API_URL = "https://places.googleapis.com/v1";

if (!API_KEY) {
  console.warn("GOOGLE_MAPS_API_KEY is not set.");
}

export type PlaceResult = {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  location: { latitude: number; longitude: number };
  types: string[];
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  businessStatus?: string;
  photos?: { name: string; authorAttributions: any[] }[];
};

export async function searchNearby(
  lat: number,
  lng: number,
  radius: number = 1000,
  includedTypes: string[] = ["restaurant", "cafe", "bakery", "meal_takeaway"]
): Promise<PlaceResult[]> {
  const url = `${PLACES_API_URL}/places:searchNearby`;

  const requestBody = {
    includedTypes,
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius,
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY || "",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.primaryType,places.businessStatus,places.photos",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Places API Error:", errorText);
      throw new Error(`Places API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.places || [];
  } catch (error) {
    console.error("Failed to search nearby places:", error);
    return [];
  }
}

export async function searchByText(
  query: string,
  lat: number,
  lng: number,
  radius: number = 1000
): Promise<PlaceResult[]> {
  const url = `${PLACES_API_URL}/places:searchText`;
  const requestBody = {
    textQuery: query,
    maxResultCount: 20,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius,
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY || "",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.primaryType,places.businessStatus,places.photos",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Places API Error:", errorText);
      throw new Error(`Places API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.places || [];
  } catch (error) {
    console.error("Failed to search by text:", error);
    return [];
  }
}

export async function getPlaceDetails(placeId: string): Promise<any> {
  const url = `${PLACES_API_URL}/places/${placeId}`;
  
  // Fields to fetch for detailed view and AI analysis
  const fields = [
    "id",
    "displayName",
    "formattedAddress",
    "location",
    "types",
    "rating",
    "userRatingCount",
    "websiteUri",
    "googleMapsUri",
    "regularOpeningHours",
    "editorialSummary",
    "reviews", // Critical for AI analysis
    "photos"
  ].join(",");

  try {
    const response = await fetch(`${url}?fields=${fields}&key=${API_KEY}`, {
      method: "GET", 
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Places Details Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to get details for place ${placeId}:`, error);
    return null;
  }
}
