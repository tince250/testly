# testly

Educational app that extracts a hierarchical index of key concepts from course
materials and lets professors auto-generate tests from it. See `SOTIS specifikacija.pdf`
for the full project specification.

## Backend setup

Prerequisites: Docker (for the database) and Python 3.10+.

1. **Start the database** (from the repo root):

   ```bash
   docker compose up -d
   ```

   This runs Postgres 16 on `localhost:5434` with database `testly_db`. Data is
   persisted in the `testly-db-data` volume.

2. **Configure environment variables**:

   ```bash
   cd back
   cp .env.example .env
   ```

   Then edit `.env` — generate a `SECRET_KEY`
   (`python -c "import secrets; print(secrets.token_hex(32))"`) and add your
   `GROQ_API_KEY` and `LLAMA_CLOUD_API_KEY`. The default `DATABASE_URL` already
   matches the Docker service.

3. **Install dependencies and run the API** (from `back/`):

   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

   The API starts on `http://127.0.0.1:8000` and creates its tables on startup.
   Interactive docs are at `http://127.0.0.1:8000/docs`.

To stop the database: `docker compose down` (add `-v` to also delete the data).
