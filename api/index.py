import os
import sys

# Add project root directory to Python path for Vercel Serverless Function
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import the main FastAPI / ASGI application
from asgi_app import app

# Vercel looks for the ASGI application object (app)
__all__ = ["app"]
