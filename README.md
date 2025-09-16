# Valorant Mobile Web Application

This project is a web application inspired by Valorant, designed for mobile users. It consists of a frontend built with React and TailwindCSS, and a backend developed in Go with REST APIs. The application includes user authentication, matchmaking logic, and a leaderboard system based on ELO ratings.

## Project Structure

```
valorant-mobile-web
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── hooks
│   │   ├── services
│   │   ├── types
│   │   ├── utils
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── backend
│   ├── cmd
│   ├── internal
│   ├── pkg
│   ├── go.mod
│   └── go.sum
└── README.md
```

## Features

- **User Authentication**: Users can register and log in to their accounts.
- **Matchmaking**: Players can enter matchmaking queues and manage game sessions.
- **Leaderboard**: Displays player rankings based on ELO ratings.
- **Responsive Design**: Built with TailwindCSS for a mobile-friendly interface.

## Getting Started

### Frontend

1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```

### Backend

1. Navigate to the `backend` directory.
2. Install dependencies:
   ```
   go mod tidy
   ```
3. Run the server:
   ```
   go run cmd/server/main.go
   ```

## Technologies Used

- **Frontend**: React, TailwindCSS, TypeScript
- **Backend**: Go, PostgreSQL
- **Authentication**: Supabase (or any preferred authentication service)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.