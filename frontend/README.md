# Novah Frontend

This is the frontend for Novah, built with Next.js and React.

## Getting Started

First, ensure your backend services (API, RabbitMQ) are running, typically via Docker Compose from the root directory or the `backend` directory.

Then, to run the frontend development server:

1.  **Navigate to the frontend directory**:
    ```bash
    cd frontend
    ```

2.  **Install dependencies** (if you haven't already):
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Copy `frontend/.env.example` to `frontend/.env.local`.
    Update the variables as needed, especially:
    *   `NEXT_PUBLIC_BACKEND_URL`: Ensure this points to your running backend API (e.g., `http://localhost:8000` if backend is run via Docker Compose from root or backend directory).

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the Novah application.

## Building for Production

To create a production build:
```bash
npm run build
```
This will create an optimized build in the `.next` folder.

## Learn More about Next.js

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details. Remember to configure your production environment variables on Vercel, especially `NEXT_PUBLIC_BACKEND_URL`.
