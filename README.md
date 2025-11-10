# Payver
 

Payver is a full-stack web application designed to simplify expense management and bill splitting within groups. It provides a mobile-responsive interface for users to track shared costs, calculate balances, and settle debts using UPI integration.

## Key Features

- **User Authentication**: Secure user registration, login, and session management with JWT, including forgot/reset password functionality via email.
- **Group Management**: Create, join, leave, and delete groups. Groups can have custom names and images.
- **Expense Tracking**: Add, edit, and delete expenses within a group. Expenses are split equally among all group members by default.
- **Balance Calculation**:
    - **Actual Balance**: View a detailed breakdown of who owes whom for each transaction.
    - **Smart Balance**: An optional mode that simplifies debts by netting out mutual balances, showing the minimum number of transactions required to settle up.
- **UPI Payments**: Generate UPI links and QR codes to facilitate easy payments between members.
- **Payment Notifications & Confirmation**: A robust system for tracking payments. Users can mark a payment as completed, which sends a notification to the recipient who can then confirm or reject the payment.
- **Edit History**: All edits made to an expense are tracked, showing what was changed, by whom, and for what reason.

## Tech Stack

### Frontend

- **Framework**: Next.js (with Turbopack) & React
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: React Context API
- **Data Fetching**: Axios
- **UI Components**: Material-UI, Lucide React
- **Notifications**: Sonner

### Backend

- **Framework**: Node.js & Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **File Uploads**: `express-fileupload`
- **Email Service**: MailerSend
- **CORS**: `cors` for handling cross-origin requests

## Architecture Overview

Payver is a monorepo containing two main packages: `frontend` and `backend`.

### Backend

The backend is a Node.js server built with Express.js that provides a RESTful API for all application functionalities.

- **`controllers`**: Contain the core business logic for handling requests related to authentication, groups, and expenses. This includes the complex logic for balance calculations and payment status management.
- **`models`**: Define the Mongoose schemas for `User`, `Group`, `Expense`, and `Notification`, which map to MongoDB collections.
- **`routes`**: Define the API endpoints and connect them to the appropriate controller functions.
- **`middlewares`**: Handle authentication verification (`checkAuth`) to protect routes.
- **`utils`**: Contain helper functions for tasks like sending emails (`mailer.js`), calculating balances (`balanceUtils.js`), and generating UPI links (`upiHelpers.js`).
- **`config`**: Manages database connections and environment constants.

### Frontend

The frontend is a server-rendered application built with Next.js and React.

- **`src/app`**: Contains the main application routes, including the dashboard, group pages, and authentication forms.
- **`src/components`**: A collection of reusable React components organized by feature (e.g., `Expense`, `Balance`, `Group`).
- **`src/context`**: The `GroupContext` is a key part of the architecture, providing a centralized state management solution for a specific group's data, including its details, expenses, and balances. This avoids prop-drilling and simplifies data flow.
- **`src/services`**: A dedicated layer for making API calls to the backend, abstracting the data-fetching logic from the UI components.
- **`src/utils`**: Client-side utility functions, including error handling and balance calculation logic mirrored from the backend.

## Setup and Installation

### Prerequisites

- Node.js (>=18.0)
- npm or yarn
- A MongoDB database instance

### Backend

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `backend` root and add the following environment variables:
    ```env
    PORT=8000
    MONGO_URI=<your_mongodb_connection_string>
    JWT_SECRET=<your_jwt_secret>
    FRONTEND_URL=http://localhost:3000
    MAILERSEND_API_KEY=<your_mailersend_api_key>
    MAILERSEND_SENDER_ID=<your_mailersend_sender_id>
    MAILER_SENDER_NAME=<your_mailersend_sender_name>
    ```
4.  Build the TypeScript code:
    ```bash
    npm run build
    ```
5.  Start the development server:
    ```bash
    npm run server
    ```
    The backend server will be running on `http://localhost:8000`.

### Frontend

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env.local` file in the `frontend` root and add the backend API URL:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:8000
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
    The frontend application will be running on `http://localhost:3000`.

## API Endpoints

The backend exposes the following RESTful API endpoints:

### Authentication (`/api/auth`)

-   `POST /register`: Register a new user.
-   `POST /login`: Log in a user and issue a JWT.
-   `POST /logout`: Clear the JWT cookie.
-   `GET /me`: Get details of the currently logged-in user.
-   `POST /forgot-password`: Send a password reset link to the user's email.
-   `POST /reset-password`: Reset the user's password using a token.
-   `GET /:userId/upiId`: Get the UPI ID for a specific user.

### Group (`/api/group`)

-   `POST /create`: Create a new group.
-   `POST /join`: Join an existing group using an invite link.
-   `GET /:id`: Get detailed information about a specific group.
-   `GET /expenses/:groupId`: Get all expenses associated with a group.
-   `POST /leave/:id`: Leave a group.
-   `DELETE /:id`: Delete a group (creator only).
-   `POST /update-smart-mode`: Enable or disable Smart Balance mode for a group.

### Expense (`/api/expense`)

-   `POST /create`: Create a new expense.
-   `GET /:id`: Get details for a specific expense.
-`PUT /:id`: Update an expense.
-   `DELETE /:id`: Delete an expense.
-   `GET /notifications/:userId`: Get pending payment notifications for a user.
-   `POST /payment-completed-by-ower`: Mark a payment as completed by the payer.
-   `POST /payment-confirmed-by-receiver-via-notification`: Confirm or reject a payment from a notification.
-   `GET /payment-status`: Check the payment status for a user within an expense.
