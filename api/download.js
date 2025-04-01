import { config } from "dotenv";
import SftpClient from "ssh2-sftp-client";
import fs from "fs";
import path from "path";

config();

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

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
}