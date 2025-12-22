# IronTrack - Gym Workout Tracker

A modern, premium workout tracking application built with React and Vite.

## Features
- **Effortless Logging**: Add exercises, reps, and weights.
- **Visual History**: See your progress with a clean, dark-mode log.
- **Local Storage**: Data is saved automatically to your device (no internet needed).
- **Azure Ready**: Designed to be scalable to Azure Static Web Apps and Cosmos DB.

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Run the local server:
    ```bash
    npm run dev
    ```

3.  Open the link shown (usually `http://localhost:5173`) in your browser.

## Deployment to Azure

To take this online:
1.  Push this code to GitHub.
2.  Create an **Azure Static Web App** in the Azure Portal.
3.  Connect your GitHub repository.
4.  Azure will automatically build and deploy the site!

## Database Integration

Currently, the app uses `localStorage` for privacy and simplicity.
To sync data across devices:
1.  Set up an **Azure Function** API.
2.  Connect it to **Azure Cosmos DB** (Free Tier available).
3.  Update `src/utils/storage.js` to call the API instead of `localStorage`.
