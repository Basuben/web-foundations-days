# Library API Design

A REST API for a library's `books` resource. All requests and responses use JSON.

## Endpoints

### List all books
- **Method and path:** `GET /books`
- **Description:** Returns every book in the library.
- **Request body:** none
- **Success status:** `200 OK`

### Get one book
- **Method and path:** `GET /books/{id}`
- **Description:** Returns a single book by its id.
- **Request body:** none
- **Success status:** `200 OK`

### Create a book
- **Method and path:** `POST /books`
- **Description:** Adds a new book to the library.
- **Example request body:**
  ```json
  {
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "isbn": "9780385474542",
    "year": 1958
  }
  ```
- **Success status:** `201 Created`

### Update a book (replace)
- **Method and path:** `PUT /books/{id}`
- **Description:** Replaces all the details of an existing book.
- **Example request body:**
  ```json
  {
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "isbn": "9780385474542",
    "year": 1959
  }
  ```
- **Success status:** `200 OK`

### Update part of a book
- **Method and path:** `PATCH /books/{id}`
- **Description:** Changes only the fields you send.
- **Example request body:**
  ```json
  { "year": 1958 }
  ```
- **Success status:** `200 OK`

### Delete a book
- **Method and path:** `DELETE /books/{id}`
- **Description:** Removes a book from the library.
- **Request body:** none
- **Success status:** `204 No Content`

### List books by an author
- **Method and path:** `GET /books?author=Chinua%20Achebe`
- **Description:** Returns only the books written by the author in the query parameter.
- **Request body:** none
- **Success status:** `200 OK`

## Error codes

### 400 Bad Request
- The request is invalid, so the server cannot process it.
- **Example:** `POST /books` with the `title` missing, or with `year` set to `"nineteen"` instead of a number.

### 404 Not Found
- The resource does not exist.
- **Example:** `GET /books/9999` when no book has the id 9999.
