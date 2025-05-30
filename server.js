const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('src/app/db.json'); // Path to your db.json
const middlewares = jsonServer.defaults();

// Add a 1-second delay to all requests
server.use((req, res, next) => {
    setTimeout(() => next(), 1000); // 1000ms = 1 second
});

// Use default middlewares (logger, cors, etc.)
server.use(middlewares);

// Use the router
server.use(router);

// Run the server on port 3000
server.listen(3000, () => {
    console.log('JSON Server is running on http://localhost:3000');
});

//this server file is written to make the server slow.
