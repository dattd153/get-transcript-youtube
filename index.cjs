const express = require('express');
const { z } = require('zod');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Scraper instance (Lazy loaded)
let scraper;
const getScraper = async () => {
    if (!scraper) {
        const { YtCaptionKit } = await import('yt-caption-kit');
        scraper = new YtCaptionKit();
    }
    return scraper;
};

const RE_VIDEO_ID = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;

const extractVideoId = (input) => {
    if (!input) return null;
    const match = input.match(RE_VIDEO_ID);
    return match ? match[1] : (input.length === 11 ? input : null);
};

// Validation Schemas
const QuerySchema = z.object({
    lang: z.string().optional().default('en'),
    format: z.enum(['json', 'text', 'rtf']).optional().default('json')
});

// Formatters
const formatters = {
    text: (snippets) => snippets.map(s => s.text).join('\n'),
    rtf: (snippets, videoId) => {
        const header = `{\\rtf1\\ansi\\deff0 {\\fonttbl{\\f0 Arial;}}\n{\\info{\\title YouTube Transcript - ${videoId}}}\n\\f0\\fs24 `;
        const content = snippets.map(s => {
            const time = `[${Math.floor(s.start / 60000)}:${String(Math.floor((s.start % 60000) / 1000)).padStart(2, '0')}]`;
            return `\\b ${time}\\b0  ${s.text}\\line\n`;
        }).join('');
        return `${header}${content}}`;
    }
};

app.get('/transcript/:videoId', async (req, res) => {
    try {
        const videoId = extractVideoId(req.params.videoId);
        if (!videoId) return res.status(400).json({ success: false, error: 'Invalid Video ID or URL' });

        const { lang, format } = QuerySchema.parse(req.query);
        const kit = await getScraper();
        
        const transcript = await kit.fetch(videoId, { languages: [lang] });
        const snippets = transcript.snippets;

        if (format === 'text') {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.send(formatters.text(snippets));
        }

        if (format === 'rtf') {
            res.setHeader('Content-Type', 'application/rtf');
            res.setHeader('Content-Disposition', `attachment; filename="transcript_${videoId}.rtf"`);
            return res.send(formatters.rtf(snippets, videoId));
        }

        // Default JSON
        res.json({
            success: true,
            videoId,
            lang,
            length: snippets.length,
            data: snippets.map(({ start, duration, text }) => ({
                start: start / 1000,
                duration: duration / 1000,
                text
            }))
        });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Validation error', details: err.errors });
        }
        
        const isNotFound = err.name === 'NoTranscriptFound' || err.message.includes('not found') || err.message.includes('Could not retrieve transcript');
        const status = isNotFound ? 404 : 500;
        
        // Provide a meaningful message if the library returns an empty one
        let message = err.message || (isNotFound ? `No transcript found for the requested language or video.` : 'An unknown error occurred.');

        res.status(status).json({
            success: false,
            error: isNotFound ? 'Transcript not found' : 'Failed to fetch transcript',
            message: message
        });
    }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
    console.log(`🚀 API started on port ${PORT}`);
});
