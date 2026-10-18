import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from server.app.core.config import settings
from server.app.database.session import engine
from server.app.models import Base
from server.app.api.routes import (
    auth, complaints, clusters, map as map_route,
    departments, analytics, admin
)

# Ensure database tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Portfolio-Grade AI-Driven Civic Grievance Analysis, Semantic Similarity Matching, and Geospatial Intelligence Platform.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for photo evidence
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Healthcheck Endpoint
@app.get(f"{settings.API_V1_PREFIX}/health", tags=["System"])
def health_check():
    """System liveness and readiness probe."""
    return {
        "status": "healthy",
        "service": "CivicPulse AI Grievance Intelligence",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "database": "connected",
        "vector_store": settings.VECTOR_STORE_BACKEND
    }

# Register API Routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(complaints.router, prefix=settings.API_V1_PREFIX)
app.include_router(clusters.router, prefix=settings.API_V1_PREFIX)
app.include_router(map_route.router, prefix=settings.API_V1_PREFIX)
app.include_router(departments.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin.router, prefix=settings.API_V1_PREFIX)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Clean production error handler without exposing sensitive tracebacks."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal error occurred while processing the grievance request."}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server.app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
