# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
NSE Resource Scheduler

A centralized operations dashboard and resource planning tool designed to bridge the gap between office scheduling and field execution.

Features

Authentication: Secure login and registration with Role-Based Access Control (RBAC).

Project Management: Full CRUD operations for active job sites.

Resource Calculators: Algorithms to calculate required manpower vs. project duration.

Live Operations Dashboard: Real-time matrix of active phases, manpower distribution, and site status (Green/Yellow/Red indicators).

Prerequisites

To run this application on your local machine, you will need:

Node.js (v16 or higher)

MongoDB (Running locally or a MongoDB Atlas URI)

Installation & Setup

1. Clone the Repository

git clone <your-github-repo-url>
cd <your-repo-name>


2. Environment Variables

You need to set up your local environment variables. Create a .env file in the root of your backend folder and add the following:

PORT=5000
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_super_secret_jwt_key


3. Install Dependencies

You will need to install the Node modules for both the frontend and the backend.

For the Backend:

# Navigate to the backend directory (if separated)
npm install


For the Frontend:

# Navigate to the frontend directory
npm install


Running the Application

To run the app locally, you need to start both the backend server and the frontend client in two separate terminal windows.

Terminal 1 (Backend):

# Inside the backend folder
npm run dev
# The server should start on http://localhost:5000


Terminal 2 (Frontend):

# Inside the frontend folder
npm start
# The React app should open in your browser at http://localhost:3000


Tech Stack

Frontend: React.js, Tailwind CSS, React Router DOM

Backend: Node.js, Express.js

Database: MongoDB, Mongoose