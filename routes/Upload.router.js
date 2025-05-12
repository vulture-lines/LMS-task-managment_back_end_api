const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { uploadFile, uploadFile2 } = require("../middleware/fileUpload"); 
const { promisify } = require("util");

const unlinkFile = promisify(fs.unlink); 
const router = express.Router();


const upload = multer({
  dest: path.join(__dirname, "../temp"), 
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});
router.post( "/type", upload.single("file"),
  async (req, res) => {
    const tempFiles = [];
    const uploadedFile = req.file;

    try {
      if (!uploadedFile) {
        return res.status(400).json({ message: "No file uploaded." });
      }

     
      const filePath = uploadedFile.path;
      const fileName = uploadedFile.originalname;
      tempFiles.push(filePath); 

      console.log(`File uploaded to temp folder: ${filePath}`);
      const { url, type } = await uploadFile2(filePath, fileName);
      console.log("File uploaded to Firebase:", { url, type });

      return res.status(200).json({
        success: true,
        message: "File uploaded successfully.",
        fileUrl: url,
        fileType: type,
      });
    } catch (error) {
      console.error("Error during file upload process:", error.message);
      return res.status(500).json({
        success: false,
        message: "An error occurred during the file upload process.",
      });
    } finally {
     
      await Promise.all(
        tempFiles.map(async (filePath) => {
          try {
            await unlinkFile(filePath);
            console.log(`Temporary file deleted: ${filePath}`);
          } catch (err) {
            console.error(`Failed to delete temp file: ${filePath}`, err.message);
          }
        })
      );
    }
  }
);


router.post("/",upload.single("file"), 
  async (req, res) => {
    const tempFiles = [];
    const uploadedFile = req.file;

    try {
      if (!uploadedFile) {
        return res.status(400).json({ message: "No file uploaded." });
      }

      const filePath = uploadedFile.path;
      const fileName = uploadedFile.originalname;
      tempFiles.push(filePath); 

      console.log(`File uploaded to temp folder: ${filePath}`);
      const fileUrl = await uploadFile(filePath, fileName);
      console.log("File uploaded to Firebase:", fileUrl);

      return res.status(200).json({
        success: true,
        message: "File uploaded successfully.",
        fileUrl,
      });
    } catch (error) {
      console.error("Error during file upload process:", error.message);
      return res.status(500).json({
        success: false,
        message: "An error occurred during the file upload process.",
      });
    } finally {
   
      await Promise.all(
        tempFiles.map(async (filePath) => {
          try {
            await unlinkFile(filePath);
            console.log(`Temporary file deleted: ${filePath}`);
          } catch (err) {
            console.error(`Failed to delete temp file: ${filePath}`, err.message);
          }
        })
      );
    }
  }
);

module.exports = router;
