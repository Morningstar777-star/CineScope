import httpx

query = """
query ($id: Int) {
  Media (id: $id, type: ANIME) {
    reviews (page: 1, perPage: 25, sort: RATING_DESC) {
      nodes {
        id
        summary
        rating
        user { name }
        body(asHtml: false)
      }
    }
  }
}
"""
r = httpx.post("https://graphql.anilist.co", json={"query": query, "variables": {"id": 171627}})
print("AniList status:", r.status_code)
nodes = r.json().get("data", {}).get("Media", {}).get("reviews", {}).get("nodes", [])
print(f"Retrieved {len(nodes)} reviews from AniList!")
for n in nodes[:5]:
    print(" - User:", n.get("user", {}).get("name"), "Rating:", n.get("rating"), "Summary:", n.get("summary"))
