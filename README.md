# bitespeed-backend

## Backend URL
The backend is running at: `http://localhost:3000`

## API Endpoint
- **POST** `/identify` - Main endpoint for contact identification and creation

## Test Cases Covered
I have tested this API with all of the following test cases mentioned in the Notion link:

1. **No catch found for email or phone number, new contact created.**
2. **Match on phone number only, create secondary contact.**
3. **Match on email only create secondary contact.**
4. **Email and phone number provided, but already linked via secondary precedence.**
5. **Match on both fields, so no new contact created.**
6. **Match on both fields but having different primary contacts.**
7. **Only email or phone number provided**

## Additional Endpoint
Additionally, I have also created an endpoint to clean the database for testing purposes:
- **POST** `/clean-db` - Clears all data from the database



## Environment Setup

### Local Dev
Create a `.env` file in the root dir - 
```
DATABASE_URL="file:./dev.db"
```

### Production Deployment
Set `DATABASE_URL` to a  SQLite db file -
```
DATABASE_URL="file:/tmp/production.db"
```

## Install and Setup

Install dependencies -
```bash
npm install
```

For local -
```bash
npm run dev
```

For production -
```bash
npm run build
npm start
```


## I'm looking forward for your response

# Thank you
