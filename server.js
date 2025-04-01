require("dotenv").config();
const express = require("express");
const SftpClient = require("ssh2-sftp-client");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.get("/download", async (req, res) => {
    const remoteFilePath = req.query.file;
    const localFilePath = path.join(__dirname, "downloads", remoteFilePath);

    if (!remoteFilePath) {
        return res.status(400).json({ error: "Missing file query parameter" });
    }

    const sftp = new SftpClient();

    try {
        await sftp.connect({
            host: process.env.SFTP_HOST,
            port: process.env.SFTP_PORT,
            username: process.env.SFTP_USERNAME,
            password: process.env.SFTP_PASSWORD,
        });

        console.log("Connected to SFTP server");
        console.log("Downloading " + remoteFilePath + "...");
        await sftp.fastGet(remoteFilePath, localFilePath);
        await sftp.end();

        res.download(localFilePath, path.basename(remoteFilePath), (err) => {
            if (err) console.error("Download error:", err);
            fs.unlinkSync(localFilePath); // Delete file after sending
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/list", async (req, res) => {
    const sftp = new SftpClient();

    try {
        await sftp.connect({
            host: process.env.SFTP_HOST,
            port: process.env.SFTP_PORT,
            username: process.env.SFTP_USERNAME,
            password: process.env.SFTP_PASSWORD,
        });

        console.log("Connected to SFTP server");

        const dirList = await sftp.list('/');

        for (const dir of dirList) {
            console.log("Directory: " + dir.name);

            // check if file is xml
            if (!dir.name.includes(".xml")) continue;


        }

        res.status(200).json(dirList.map(dir => dir.name));
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`SFTP service is running on port ${port}`);
});