# Nuxt AI Chatbot with Live Cursors and Translation

A real-time chat application built with Nuxt.js featuring live cursor tracking for all active users, AI-powered translation, and room management with authentication..

# Features

## Real-time Communication
*Live Messaging*: Instant message delivery using Socket.io

*Live Cursor Tracking*: See other users' cursor positions in real-time

*User Presence*: Know who's online in each chat room

*Join/Leave Notifications*: System messages when users enter or exit rooms

## Room Management
*Create Custom Rooms*: Create public or private chat rooms

*Room Customization*: Set room names, descriptions, and colors

*Password Protection*: Secure rooms with password access

*Room Listings*: Browse available chat rooms

## Authentication System
*User Registration*: Create an account with email and password

*User Authentication*: Secure login with JWT

*User Profiles*: Display user information and avatars

*Access Control*: Different permissions for authenticated and unauthenticated users

## AI-Powered Features
*Message Translation*: Translate messages to different languages

*Rich Text Editing*: Format messages with a rich text editor


#Technologies Used

##Frontend

*Nuxt.js*: Vue-based framework for server-side rendering

*Vue.js*: Progressive JavaScript framework

*Tailwind CSS*: Utility-first CSS framework

*Socket.io Client*: Real-time bidirectional event-based communication


##Backend
*Node.js*: JavaScript runtime

*Socket.io*: Real-time server implementation

*MongoDB*: NoSQL database for storing rooms and messages

*Mongoose*: MongoDB object modeling for Node.js

*JWT*: JSON Web Tokens for authentication

*bcrypt.js*: Password hashing library

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Socket Server 
Start the socket server on `http://localhost:3001`
```bash
node socket-server.js
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

