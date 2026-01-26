import express from "express";
import dotenv from "dotenv";
import { createQueue } from "../shared/queue.js";
import {upload} from "multer.js";

const app = express();
const queue = createQueue();
dotenv.config();

const PORT = process.env.API_PORT || 3000;

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
  });
});


app.post('/api/convert', upload.single('video'), async (req,res) => { 
    // By now i will have req.file -> file info 
    // req.body -> file metadata
    // the actual file in uploads 

    // gotta check if file exists
    if (!req.file) {
        res.status(400).json({
            error: 'File not found'
        })
    }

    const format = req.body.format || 'mp4';
    const resolution = req.body.resolution || 'original';

    const jobData = {
        uploadPath : req.file.path,
        fileName : req.file.filename,
        format : format,
        resolution :  resolution,
        convertTo : 'mpeg', // remove the hardcode later
        uploadTime : req.file.uploadTime
    }

    // create the job
    const job = await queue.add('convert-video',jobData);

    res.status(202).json({
        message: "Video processing",
        jobId: job.id,
        status: await job.getState(),
        data: jobData
    });

})

app.listen(PORT, () => console.log(`%videoconverter% running on %${PORT}%`));
