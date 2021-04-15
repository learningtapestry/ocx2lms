# Installation

1. `npm i`
2. `num run build`

# Usage

Either define environment variables before running commands or set them in `.env` (see `.env.template` for a list of environment variables).

- `npm run build` builds the application
- `npm run dev-start` builds and runs the default dev command (generate all documents)
- `npm run generate-by-id [document_id]` runs the generation process for a resource in the `documents` table
