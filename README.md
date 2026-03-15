# YouTube Transcript API 🚀

A robust, zero-browser Node.js API to fetch transcripts from YouTube videos in various formats (JSON, Plain Text, RTF).

## Features

- **Fast & Reliable**: Uses the `yt-caption-kit` library for efficient transcript retrieval without headless browsers.
- **Multiple Formats**: Support for JSON, Plain Text, and Rich Text Format (.rtf) downloads.
- **Auto-Correction**: Handles both full YouTube URLs and 11-char Video IDs.
- **Language Support**: Default to English, with full support for any available transcript language.
- **Self-Documenting Errors**: Descriptive error messages for missing captions or invalid IDs.

## Installation

1. **Clone the repository**:
   ```bash
   git clone git@github.com:dattd153/get-transcript-youtube.git
   cd get-transcript-youtube
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```
   The API will be available at `http://localhost:3000`.

## API Usage

### Endpoint: `GET /transcript/:videoId`

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `videoId` | `string` | **Required**. YouTube Video ID (e.g., `dQw4w9WgXcQ`) or full URL. |
| `lang` | `string` | Optional. Language code (e.g., `vi`, `en`). Default: `en`. |
| `format` | `string` | Optional. Response format (`json`, `text`, `rtf`). Default: `json`. |

### Examples

- **Get JSON (Default)**:
  `GET http://localhost:3000/transcript/dQw4w9WgXcQ`

- **Get Plain Text (Vietnamese)**:
  `GET http://localhost:3000/transcript/saLqoV89mgQ?lang=vi&format=text`

- **Download RTF File**:
  `GET http://localhost:3000/transcript/dQw4w9WgXcQ?format=rtf`

## Response Formats

### JSON (Default)
Returns an object with metadata and an array of transcript snippets with `start` and `duration` in seconds.

### Text
Returns the raw transcript content as a plain text string.

### RTF
Triggers a file download (`.rtf`) containing the transcript with bolded timestamps for easier readability.

## Health Check

Check if the API is running:
`GET http://localhost:3000/health`

## License

ISC
