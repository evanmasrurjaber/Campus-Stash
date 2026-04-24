# CampusStash Backend (Express + MongoDB Atlas)

## Setup
1. Create .env file in /server folder
2. Paste the necessary environment variables into .env:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `CLIENT_URL`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. Install dependencies:
   - `npm install`
4. Start development server:
   - `npm run dev`

## API

- `GET /` basic status string.
- `POST /api/items/lost` protected multipart endpoint to report a lost item.

## Scripts

- `npm run dev` run with nodemon.
- `npm start` run with node.
- `npm run lint` run eslint.
