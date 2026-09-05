import requests
import json

# Configuration
OPENVIKING_BASE_URL = "http://127.0.0.1:1933/api/v1"

def openviking_query(question, target_uri=None, top_k=5, score_threshold=0.4):
    """
    Perform a query search on OpenViking.
    """
    url = f"{OPENVIKING_BASE_URL}/search/search"
    payload = {
        "query": question,
        "mode": "list",
        "top_k": top_k,
        "score_threshold": score_threshold,
    }
    if target_uri:
        payload["target_uri"] = target_uri

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error querying OpenViking: {e}")
        return None

def openviking_write(uri, content, metadata=None):
    """
    Perform a content write operation on OpenViking.
    """
    url = f"{OPENVIKING_BASE_URL}/content/write"
    payload = {
        "uri": uri,
        "content": content,
        "mode": "replace"
    }
    if metadata:
        payload["metadata"] = metadata

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error writing to OpenViking: {e}")
        return None

def omniroute_status():
    """
    Placeholder for checking OmniRoute status.
    """
    print("OmniRoute status checked (placeholder)")
    return {"status": "ok"}
