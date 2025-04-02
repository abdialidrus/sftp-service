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
        console.log("Listing files in the directory");

        // Get available files in the directory
        const fileList = await sftp.list('/');
        const fileNames = fileList.map(file => file.name);
        if (fileNames.length === 0) {
            console.log("No files found");
            return res.status(404).json({ error: "No files found" });
        }

        console.log("Files found in the directory");
        console.log("Finding file with the current date");

        // Get current date and
        // convert it to dd-mmm-yyyy format
        const today = new Date();
        const todayFormatted = new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "Australia/Sydney"
        })
            .format(today)
            .replaceAll(" ", "-");

        // check if any items in the file name list contains the date
        const fileName = fileNames.find(file => file.includes(todayFormatted));
        if (!fileName) {
            console.log("No files found with the current date");
            return res.status(404).json({ error: "No files found with the current date" });
        }

        // check if the file type is .xml
        const fileType = fileName.split(".").pop();
        if (fileType !== "xml") {
            console.log("File type not supported");
            return res.status(404).json({ error: "File type not supported" });
        }

        console.log("File found with the current date");
        console.log("Downloading file");

        // setup the download path
        const remoteFilePath = fileName;
        const localFilePath = path.join("/tmp", path.basename(remoteFilePath));

        // download the file
        console.log(`Downloading file from ${remoteFilePath} to ${localFilePath}`);
        await sftp.fastGet(remoteFilePath, localFilePath);
        sftp.end();

        // read the file as a buffer
        const fileBuffer = await fs.readFileSync(localFilePath);
        const localFileName = path.basename(remoteFilePath);

        // set response headers
        res.setHeader("Content-Disposition", `attachment; filename=${localFileName}`);
        res.setHeader("Content-Type", "application/octet-stream");

        // send the file as a buffer
        res.status(200).send(fileBuffer);

        // delete the local file
        fs.unlinkSync(localFilePath);

        console.log("File downloaded successfully");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
}