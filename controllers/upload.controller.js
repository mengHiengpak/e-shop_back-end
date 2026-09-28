const multer = require('multer'); // Fixed: Changed 'module' to 'multer'
const fs = require('fs');
const path = require('path');     // Fixed: Added missing path import

// --- Multer Configuration ---

const diskStorage = multer.diskStorage({ // Fixed: consistent variable naming
    destination: (req, file, cb) => {
        const folderPath = path.join(__dirname, '../upload');
        fs.mkdirSync(folderPath, { recursive: true });
        cb(null, folderPath);
    },

    filename: (req, file, cb) => { // Fixed: 'fileName' -> 'filename'
        const extName = path.extname(file.originalname);
        const filename = Date.now() + extName; // Fixed: 'date.now()' -> 'Date.now()'
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedType = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedType.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only .jpg, .jpeg, and .png files are allowed!'));
    }
};

const upload = multer({
    storage: diskStorage, // Fixed: 'Storage' -> 'storage'
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Fixed: 'filsSize' -> 'fileSize'
    }
});

// --- Controller Methods ---

exports.uploadFile = (req, res) => {
    try {
        upload.single('imageUrl')(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    error: err.message
                });
            }
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file provided'
                });
            }

            // Fixed: Changed 'req.status' to 'res.status'
            return res.status(200).json({
                success: true,
                message: 'Upload successful',
                filename: req.file.filename
            });
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Upload failed internal server error"
        });
    }
};

exports.removeFile = (req, res) => {
    try {
        // Fixed: Changed 'req.bady' to 'req.body'
        if (!req.params || !req.params.imageUrl) {
            return res.status(400).json({
                success: false,
                error: 'Image filename is required in req.body!'
            });
        }

        const imagePath = path.join(__dirname, '../upload', req.params.imageUrl);

        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            return res.status(200).json({
                success: true,
                message: 'Image deleted successfully'
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'Image not found on the server!'
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to remove file'
        });
    }
};