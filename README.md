# FreightForwarder Ai Assistant

## Local Quickstart

### 1. Clone the Repo
### 2. Install Dependencies : npm install
### 3. Install Supabase & Run Locally
  1. Install Docker
  2. Install Supabase CLI (Windows)
    scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
    scoop install supabase
  3. Start Supabase : supabase start
### 4. Fill in Secrets
  1. Environment Variables : cp .env.local.example .env.local and Get the required values by running: supabase status
    Note: Use `API URL` from `supabase status` for `NEXT_PUBLIC_SUPABASE_URL`
  then go to your `.env.local` file and fill in the values.
  2. SQL Setup
    In the 1st migration file `supabase/migrations/20240108234540_setup.sql` replace 2 values with the values you got above:
      - `project_url` (line 53): `http://supabase_kong_chatbotui:8000` (default) can remain unchanged if you don't change your `project_id` in the `config.toml` file
      - `service_role_key` (line 54): You got this value from running `supabase status`
### 5. Install Ollama
### 6. Run app locally : npm run chat
