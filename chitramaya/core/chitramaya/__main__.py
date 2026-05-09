"""Run ChitraMaya Engine API with uvicorn."""
import uvicorn

if __name__ == "__main__":
    uvicorn.run("chitramaya.server:app", host="0.0.0.0", port=8190, reload=True)
