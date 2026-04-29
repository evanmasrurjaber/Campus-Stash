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
<<<<<<< Updated upstream
=======
- `POST /api/items/lost` protected multipart endpoint to report a lost item.
- `GET /api/auth/me` protected profile read endpoint.
- `PATCH /api/auth/me` protected multipart endpoint to update `fullName`, `phoneNumber`, `studentId`, and optional `avatar` image field.
>>>>>>> Stashed changes

## Scripts

- `npm run dev` run with nodemon.
- `npm start` run with node.
- `npm run lint` run eslint.
