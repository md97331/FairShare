# FairShare

## Overview

Fair Share is a mobile application designed to make splitting bills among friends easy and efficient. The app provides a seamless way to scan, process, and split expenses, reducing manual calculations and improving financial management. Built with React Native, Node.js, Firebase and OpenAI. Fair Share ensures a smooth user experience on both Android and IOS platform.

# Demo 

https://youtu.be/UkIMWfLS02g?si=WPQCH5w5xhz2hsvI

## Contributors

Mario Diaz

Kaung Myat Naing

Sanjay Sakthivel

Vignesh Ram Ramesh Kutti

## Features
- User Authentication: Secure login and account management

  [<img src="https://github.com/user-attachments/assets/29bf16b0-24e2-471c-920b-bf660b57d3a9" width="250"/>](register_page.png)
  [<img src="https://github.com/user-attachments/assets/88b04c18-d2c7-4c9e-ac73-8b8b91cf7596" width="250"/>](login_page.png)
  [<img src="https://github.com/user-attachments/assets/62e9927b-5a40-437d-aa32-0a8091b64cb7" width="250"/>](sucessfull_login.png)

- Home page: Display recent transcations and shared expenses.

  [<img src="https://github.com/user-attachments/assets/95dad5fe-569a-40d9-a91c-7edc421a0fdc" width="250"/> <img src="https://github.com/user-attachments/assets/f47569dc-528b-4497-b6de-31cceffb3d8e" width="250"/>](home_page.png)
    
    - Past Transactions: Past transactions can be viewed.
      
    [<img src="https://github.com/user-attachments/assets/d0d8cdf2-721c-489f-af53-69dff18a2067" width="250"/>](past_transaction_page_2.png)    
  
- Spending Analysis: Monthly expenditure breakdown with interaction charts.
  
   [<img src="https://github.com/user-attachments/assets/9c6ca128-2ce7-4933-abc3-d43208a36531" width="250"/>](analysis_page_with_data.png)
  
- Bill Uploading:
    
    - Capture a bill using mobile camera or upload from the gallery.
      
       [<img src="https://github.com/user-attachments/assets/8181a008-d8d3-4436-85db-813f91b6190e" width="250"/> <img src="https://github.com/user-attachments/assets/d8096573-7d51-4a9c-8632-52ecf0d4a5e8" width="250"/>](creating_split.png)
    
    - Extract text from images using OpenAI's OCR capabilities.
      
       [<img src="https://github.com/user-attachments/assets/2d563154-e8a0-4020-87bf-1751c21db171" width="250"/> <img src="https://github.com/user-attachments/assets/7ea7f7d0-20a0-4a7c-aaed-15286cd4a1a9" width="250"/>](bill_analysis_progression_page.png)
      

- Bill Spliting:

    - Automatically generates a split breakdown of the bill
      
      [<img src="https://github.com/user-attachments/assets/7a0bd880-6630-4d06-b894-e9f95ebf1fb2" width="250"/>](bill_splitting_page.png)
     
    
    - Users can tag friends to each item on the bill.
      
      [<img src="https://github.com/user-attachments/assets/fd89e950-3f69-41a6-aff8-ad942c6167ed" width="250"/>](Assigning_people_to_items.png)
     

- Friends Management: Add new friends and mangage existing once.
  
   [<img src="https://github.com/user-attachments/assets/7c8b939e-ac96-48fe-b2ed-25572656f945" width="250"/> <img src="https://github.com/user-attachments/assets/9d74dc9e-033c-457b-87bb-f31a0f3c9e9f" width="250"/>](empty_friend_list.png)
  
- Profile Page: View and manage user details.
  
   [<img src="https://github.com/user-attachments/assets/e4aaf29c-d399-4917-afc3-fc8c490e1128" width="250"/>](profile.png)

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
