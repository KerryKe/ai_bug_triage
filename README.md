This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## Getting Started

Follow these steps to set up and run the AI Bug Triage Board on a new machine.

### Prerequisites
* Ensure you have [Node.js](https://nodejs.org/) (v18+ recommended) installed.
* Ensure you have a valid Google Gemini API Key (for other AIP keys, please modify the model in ~/src/server/ai.ts).

### 1. Install Dependencies
After pulling the repository, install all required packages. 

```
npm install
```

### 2. Set Up Environment Variables
Create a new file named `.env` in the root directory of the project. Add your database connection string and your API key:

```
# Local SQLite Database connection
DATABASE_URL="file:./db.sqlite"

# Gemini API Key for AI Triage, Similarity Scoring, and Chat Agent
GEMINI_API_KEY="your_actual_api_key_here"
```

### 3. Initialize the Database (Prisma)

```
npx prisma generate
npx prisma db push
```

### 4. Run the Application
```
npm run dev
```

The application will now be running at `http://localhost:3000`.
