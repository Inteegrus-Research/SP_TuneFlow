import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import ytdl from 'ytdl-core';
import dotenv from 'dotenv';
import delay from 'delay'; // NEW: Add this after your other imports
import youtubeDlExec from 'youtube-dl-exec';
const exec = youtubeDlExec;

dotenv.config();

const app = express();
const PORT = 8000;

// YouTube API configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

if (!YOUTUBE_API_KEY) {
  console.error('YOUTUBE_API_KEY is not set in environment variables');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Root route for health check
app.get('/', (req, res) => {
  res.json({ status: 'healthy', message: 'TuneFlow API Server' });
});

// Generic retry function with exponential backoff
const retryWithBackoff = async (operation, retries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if it's a rate limit error
      if (error.message.includes('429')) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Rate limit hit, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
};

// Search endpoint using YouTube Data API with retry logic
const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
  return retryWithBackoff(async () => {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return { response, data };
  }, retries, delay);
};

app.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid search query',
        details: 'Search query must be a non-empty string'
      });
    }

    console.log('Processing search request for:', query);

    const searchUrl = `${YOUTUBE_API_URL}/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
    
    const { response, data } = await fetchWithRetry(searchUrl);

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return res.status(404).json({
        error: 'No results found',
        details: 'The search query returned no results'
      });
    }

    const formattedResults = data.items
      .filter(item => item.id?.videoId && item.snippet)
      .map(item => ({
        id: item.id.videoId,
        name: item.snippet.title,
        artist: item.snippet.channelTitle,
        image: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        videoId: item.id.videoId,
        description: item.snippet.description
      }));

    if (formattedResults.length === 0) {
      return res.status(404).json({
        error: 'No valid results',
        details: 'No results matched the required format'
      });
    }

    console.log(`Successfully found ${formattedResults.length} results for query: ${query}`);
    res.status(200).json(formattedResults);

  } catch (error) {
    console.error('Search endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Retry logic with backoff for YouTube API rate limit (429)
async function getInfoWithRetry(videoUrl, retries = 3, delayMs = 5000) {
  try {
    return await ytdl.getInfo(videoUrl);
  } catch (err) {
    if (retries > 0 && err.message.includes('429')) {
      console.warn(`⚠️ Rate limit hit. Retrying in ${delayMs / 1000}s...`);
      await delay(delayMs);
      return getInfoWithRetry(videoUrl, retries - 1, delayMs + 2000); // increase delay each time
    }
    throw err;
  }
}


// Stream endpoint with improved error handling and retry logic
import youtubedl from 'youtube-dl-exec';
import path from 'path';

const ytDlpPath = path.resolve('./yt-dlp.exe');

import { spawn } from 'child_process';

app.get('/stream/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    res.setHeader('Content-Type', 'audio/webm');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');


const ytdlp = spawn(ytDlpPath, [
  '-f', '234/233',
  '--extract-audio',
  '--audio-format', 'mp3',
  '--ffmpeg-location', 'C:\\ffmpeg\\ffmpeg-7.1.1-full_build\\bin',
  '-o', '-',
  url
]);







    ytdlp.stdout.pipe(res);

    let stderrData = '';

    ytdlp.stderr.on('data', (chunk) => {
      const data = chunk.toString();
      stderrData += data;
      console.error(`yt-dlp stderr: ${data}`);

      if (data.includes('Signature extraction failed')) {
        console.warn('❗ Detected signature extraction issue – YouTube may have changed their player script');
      }

      if (data.includes('Requested format is not available')) {
        console.warn('⚠️ Requested format may be blocked. Consider listing formats via yt-dlp -F');
      }
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        console.error(`yt-dlp process exited with code ${code}`);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Streaming error',
            details: stderrData || 'yt-dlp exited unexpectedly'
          });
        }
      }
    });

  } catch (error) {
    console.error('Stream endpoint error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Streaming failed', details: error.message });
    }
  }
});




// Download endpoint with improved error handling and retry logic
app.get('/download/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const downloadDir = path.resolve('./downloads');
    const outputPath = path.join(downloadDir, `${videoId}.mp3`);

    // Ensure the downloads directory exists
    fs.mkdirSync(downloadDir, { recursive: true });

    const ytdlp = spawn(ytDlpPath, [
      '-f', '234/233',
      '--ffmpeg-location', 'C:\\ffmpeg\\ffmpeg-7.1.1-full_build\\bin',
      '--extract-audio',
      '--audio-format', 'mp3',
      '-o', outputPath,
      url
    ]);

    ytdlp.stderr.on('data', (data) => {
      console.error(`yt-dlp stderr: ${data}`);
    });

    ytdlp.on('close', (code) => {
      if (code === 0) {
        return res.download(outputPath); // triggers browser download
      } else {
        console.error(`yt-dlp exited with code ${code}`);
        return res.status(500).json({ error: 'Download failed' });
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});


// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Unexpected server error',
      details: err.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    details: `Route ${req.method} ${req.url} not found`
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});