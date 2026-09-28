const express = require('express')
const {uploadFile, removeFile} = require('../controllers/upload.controller')
const uploadRoute = express.Router()
const restrictAguard = require('../guards/restrict.guard');

uploadRoute
    .route('/')
    .post(restrictAguard("admin"),uploadFile)

uploadRoute
    .route('/:imageUrl')
    .delete(restrictAguard("admin"),removeFile)

module.exports = uploadRoute