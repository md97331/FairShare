# FairShare

## Overview

Fair Share is a mobile application designed to mak splitting bills among friends easy and efficient. The app provides a seamless way to scan, process, and split expenses, reducing manual calculations and improving financial management. Built with React Native, Node.js, Firebase and OpenAI. Fair Share ensures a smooth user experience on both Android and IOS platform.

# Demo 

https://youtu.be/UkIMWfLS02g?si=WPQCH5w5xhz2hsvI

## Contributors

Mario Diaz

Kaung Myat Naing

Sanjay Sakthivel

Vignesh Ram Ramesh Kutti

## Features
- User Authentication: Secure login and account managemement
- Home page: Display recent transcations and shared expenses.
- Spending Analysis: Monthly expenditure breakdown with interaction charts.
- Bill Uploading:
    - Capture a bill using mobile camera or upload from the gallery.
    - Extract text from images using OpenAI's OCR capabilities.
- Bill Spliting:
    - Users can tag friends to each item on the bill.
    - Automatically generates a split breakdown of the bill.
- Friends Management: Add new friends and mangage existing once.
- Profile Page: View and manage user details.
- Error Handling and Scalability: Handles empty responses, invalid data and API errors effectively.

## Technologies Utilized
- React Native (Frontend framework for mobile development)
- Node.js (Backend for handing API requests)
- Firebase (Database for storing user data and transactions)
- OpenAI API (used for text extraction from recipts)
- react-native-chart-kit (For spending analysis visualization)

## Installation and Setup
### Clone the repository.
```bash
git clone https://github.com/md97331/FairShare.git
cd FairShare
```
### Frontend Setup
1. Navigate to the receipt-splitter directory and install dependencies.
```bash
    cd receipt-splitter
    npm install
```
2. Set up environment variables:
    - Create a .env file in the receipt-splitter folder.
    - Add your backend API base URI:
    ```
        API_BASE_URL=https://your-api-endpoint.com
    ```
3. Start the frontend development server.
```bash
    npx expo start
```
### Backend Setup
1. Navigate to the backend directory and install dependencies:
```bash
    cd ../backend
    npm install
```
2. Set up environment variables:
    - Create a .env file in the backend folder.
    - Add your OpenAI API key:
    ```
        OPENAI_API_KEY=Your-openai-key
    ```
3. Add service account key.
    - Create serviceAccountKey.json file.
    - This must contain the key for accessing firebase.

4. Start the backend server.
```bash
    npm run dev
```

## Usage

1. Login to your account.

2. Add friends with whom you share expenses.

3. Upload a bill via the camera or gallery.

4. Tag friends to each item on the bill.

5. View auto-generated bill splits.

6. Check the monthly spending analysis in the Analysis Screen.

7. Manage your profile and friends list.

## Error Handling & Edge Cases

- If an API response is empty, the app provides a user-friendly message.

- Invalid transactions are filtered to prevent incorrect calculations.

- Errors in OpenAI's OCR processing are handled with retry mechanisms.

- Secure data handling using Firebase authentication and backend validations.

## Contributing

- Fork the repository.

- Create a new branch (feature/new-feature).

- Commit your changes.

- Push the branch and create a Pull Request.

## License
This project is licensed under the MIT License.
