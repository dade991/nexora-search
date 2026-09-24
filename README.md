# Nexora Search

Nexora Search is an intelligent local discovery and search platform built with **React** and **Laravel**. It combines multiple REST APIs to provide location information, weather data, images, maps, knowledge results, GitHub information, web search, and AI-generated responses from one interface.

The project demonstrates practical implementation of **RESTful web services**, API integration, JSON data handling, Laravel backend development, React frontend development, database management, and error handling.

---

## Project Objectives

The main objectives of Nexora Search are to:

* Build a modern search and local discovery platform.
* Integrate multiple third-party REST APIs.
* Provide useful information about places and locations.
* Display interactive map information.
* Provide current weather information.
* Retrieve images and knowledge-based information.
* Integrate AI-generated responses.
* Demonstrate communication between React and Laravel.
* Handle API errors and HTTP responses correctly.
* Store important application data using a database.

---

## Technologies Used

### Frontend

* React
* Vite
* JavaScript
* JSX
* CSS
* Axios / Fetch API

### Backend

* Laravel
* PHP
* REST API
* Laravel Controllers
* Laravel Routes
* Laravel HTTP Client

### Database

* MySQL

### Development Tools

* Laragon
* Composer
* Node.js
* npm
* Visual Studio Code
* Postman
* Git
* GitHub

---

## APIs Used

Nexora Search integrates several external services.

### Google Maps API

Used for:

* Maps
* Location display
* Place information
* Geographic data

### Open-Meteo API

Used to retrieve:

* Temperature
* Weather conditions
* Humidity
* Wind speed
* Precipitation
* Location-based weather information

### Pexels API

Used to retrieve relevant images for search results and locations.

### Wikipedia / Wikimedia API

Used to retrieve:

* Location descriptions
* General knowledge
* Historical information
* Related images and media

### NVIDIA AI API

Used for AI-powered features such as:

* Search result explanation
* Natural-language responses
* Intelligent summaries
* Contextual information

### GitHub API

Used to retrieve public GitHub information such as:

* Users
* Repositories
* Repository details
* Developer information

### SearchAPI

Used to retrieve external search engine results through a REST API.

---

## REST API Architecture

Nexora Search follows a REST-based architecture.

```text
User
  |
  v
React Frontend
  |
  | HTTP Request
  v
Laravel REST API
  |
  +----------------------+
  |                      |
  v                      v
MySQL Database      External APIs
                         |
             +-----------+-----------+
             |           |           |
          Google      Open-Meteo   NVIDIA
           Maps                     AI
             |
      Other API Services
```

The React application sends requests to Laravel.

Laravel processes the request and communicates with the required external API.

The external service returns data, normally in **JSON format**.

Laravel processes the result and returns a structured JSON response to the React frontend.

---

## HTTP Methods

The application uses standard REST HTTP methods.

| Method | Purpose                      |
| ------ | ---------------------------- |
| GET    | Retrieve information         |
| POST   | Send or create information   |
| PUT    | Update existing information  |
| PATCH  | Partially update information |
| DELETE | Remove information           |

---

## HTTP Status Codes

Common HTTP status codes handled by the application include:

| Code | Meaning                       |
| ---- | ----------------------------- |
| 200  | Request successful            |
| 201  | Resource created successfully |
| 400  | Invalid request               |
| 401  | Unauthorized                  |
| 404  | Resource not found            |
| 422  | Validation error              |
| 500  | Internal server error         |
| 503  | External service unavailable  |

---

## Project Structure

```text
nexora-search/
│
├── app/
│   ├── Http/
│   │   └── Controllers/
│   └── Models/
│
├── config/
│
├── database/
│   ├── migrations/
│   └── seeders/
│
├── public/
│
├── resources/
│
├── routes/
│   ├── api.php
│   └── web.php
│
├── storage/
│
├── frontend/
│   └── React application
│
├── .env
├── artisan
├── composer.json
└── README.md
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/dade991/nexora-search.git
```

Open the project:

```bash
cd nexora-search
```

Install Laravel dependencies:

```bash
composer install
```

Install Node dependencies:

```bash
npm install
```

Create the environment file:

```bash
copy .env.example .env
```

Generate the Laravel application key:

```bash
php artisan key:generate
```

---

## Database Configuration

Update the `.env` file:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nexora_search
DB_USERNAME=root
DB_PASSWORD=
```

Create the database in MySQL and run:

```bash
php artisan migrate
```

---

## API Configuration

External API keys should be stored inside the Laravel `.env` file instead of directly inside the source code.

Example:

```env
GOOGLE_MAPS_API_KEY=your_key_here
PEXELS_API_KEY=your_key_here
NVIDIA_API_KEY=your_key_here
SEARCH_API_KEY=your_key_here
GITHUB_TOKEN=your_token_here
```

Never upload real API keys to GitHub.

---

## Running the Project

Start Laravel:

```bash
php artisan serve
```

Laravel will normally run at:

```text
http://127.0.0.1:8000
```

Start the frontend development server:

```bash
npm run dev
```

---

## Testing With Postman

Postman is used to test Nexora Search REST endpoints.

Example request:

```text
http://127.0.0.1:8000/api/weather
```

Another example:

```text
http://127.0.0.1:8000/api/search
```

Postman can be used to check:

* HTTP methods
* Request parameters
* JSON responses
* Status codes
* Validation errors
* API errors
* Response time

---

## Example JSON Response

```json
{
    "success": true,
    "source": "Open-Meteo",
    "temperature": 29.2,
    "humidity": 74,
    "wind_speed": 8,
    "condition": "Partly Cloudy"
}
```

---

## Error Handling

Nexora Search handles problems such as:

* Invalid user input
* Missing parameters
* Invalid API keys
* API request failure
* API rate limits
* Network problems
* Empty search results
* Server errors

Example:

```json
{
    "success": false,
    "message": "Unable to retrieve the requested information."
}
```

---

## Main Features

* Intelligent search
* Local place discovery
* Google Maps integration
* Weather information
* Image search
* Wikipedia information
* AI-generated responses
* GitHub search
* External web search
* REST API integration
* JSON response handling
* Responsive React interface
* Laravel API backend
* Database integration
* Error handling
* Postman API testing

---

## REST vs GraphQL

Nexora Search primarily uses REST because most of the external services integrated into the project provide REST endpoints.

REST is simple to implement, widely supported, and works naturally with Laravel.

GraphQL allows clients to request specific fields from a single endpoint, but it introduces additional complexity that is not required for the current Nexora Search architecture.

---

## Challenges

Some challenges encountered during development included:

* Managing multiple APIs.
* Different response formats from different providers.
* API authentication.
* Rate limits.
* Network delays.
* Handling failed external requests.
* Protecting API keys.
* Connecting React with Laravel.
* Processing JSON responses.
* Maintaining consistent results from multiple services.

---

## Future Improvements

Future versions of Nexora Search could include:

* Improved AI search ranking.
* User accounts and authentication.
* Search history.
* Saved locations.
* Search recommendations.
* More location providers.
* Advanced filtering.
* Real-time navigation.
* Better result caching.
* Mobile application support.
* Improved API fallback systems.

---

## Project Information

**Project Name:** Nexora Search

**Project Type:** Practical Skills Application / Software Engineering Project

**Frontend:** React

**Backend:** Laravel

**Database:** MySQL

**Architecture:** RESTful Web Services

**Developer:** Ifedade Adebayo

**Institution:** Lincoln University College

**Programme:** Computer Science (Hons) – Software Engineering

---

## Repository

GitHub:

```text
https://github.com/dade991/nexora-search
```

---

## Conclusion

Nexora Search demonstrates how modern web applications can combine multiple REST APIs through a centralized Laravel backend.

The system uses React for the user interface, Laravel for backend processing, MySQL for database storage, and several external services for maps, weather, images, knowledge, search, GitHub data, and artificial intelligence.

The project demonstrates practical knowledge of RESTful architecture, API integration, HTTP requests, JSON processing, database management, frontend-backend communication, testing, and error handling.
