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
    lang: z.string().optional().default('en')
});

app.get('/transcript/:videoId', async (req, res) => {
    try {
        const videoId = extractVideoId(req.params.videoId);
        if (!videoId) return res.status(400).json({ success: false, error: 'Invalid Video ID or URL' });

        const { lang } = QuerySchema.parse(req.query);
        const kit = await getScraper();
        
        const transcript = await kit.fetch(videoId, { languages: [lang] });

        res.json({
            success: true,
            videoId,
            lang,
            length: transcript.snippets.length,
            data: transcript.snippets.map(({ start, duration, text }) => ({
                start: start / 1000,
                duration: duration / 1000,
                text
            }))
        });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Validation error', details: err.errors });
        }
        
        const status = (err.name === 'NoTranscriptFound' || err.message.includes('not found')) ? 404 : 500;
        res.status(status).json({
            success: false,
            error: 'Failed to fetch transcript',
            message: err.message
        });
    }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
    console.log(`🚀 API started on port ${PORT}`);
});
