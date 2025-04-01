import { config } from "dotenv";
import SftpClient from "ssh2-sftp-client";
import fs from "fs";
import path from "path";

config();

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
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
}